/**
 * Tax Monitor Pro — Cloudflare Worker (API + Orchestration)
 *
 * Inbound routes:
 * - GET  /health
 * - POST /cal/webhook
 * - POST /stripe/webhook
 * - POST /forms/intake
 * - POST /forms/order
 * - POST /forms/support
 *
 * Implemented:
 * - Receipts ledger (append-only): receipts/form/{eventId}.json
 * - Canonical objects (R2 authority):
 *   - accounts/{accountId}.json
 *   - orders/{orderId}.json
 *   - support/{supportId}.json
 * - ClickUp projections:
 *   - Accounts list task creation on intake
 *   - Order/Support list task creation on their forms
 *   - Account task gets link fields to Order/Support tasks
 *
 * Contracts:
 * - R2 write occurs before ClickUp write
 * - Forms POST to https://api.taxmonitor.pro/forms/*
 * - Idempotency by eventId
 */

async function readRawBody(request) {
  return await request.text();
}

function tryParseJson(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error };
  }
}

function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

function requireMethod(request, allowed) {
  const method = request.method.toUpperCase();
  return allowed.includes(method);
}

function isPath(url, pathname) {
  return url.pathname === pathname;
}

/* ------------------------------------------
 * Body Parsing (Forms + JSON)
 * ------------------------------------------ */

async function parseInboundBody(request) {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("application/json")) {
    const raw = await request.text();
    const parsed = tryParseJson(raw);
    if (!parsed.ok) {
      return {
        ok: false,
        error: "Invalid JSON",
        details: String(parsed.error?.message || parsed.error),
      };
    }
    return { ok: true, data: parsed.value, type: "json" };
  }

  try {
    const fd = await request.formData();
    const data = {};
    for (const [k, v] of fd.entries()) {
      data[k] = typeof v === "string" ? v : (v?.name || "uploaded_file");
    }
    return { ok: true, data, type: "form" };
  } catch (error) {
    return {
      ok: false,
      error: "Unsupported body type",
      details: String(error?.message || error),
    };
  }
}

/* ------------------------------------------
 * Intake Normalization
 * ------------------------------------------ */

function normalizeIntakePayload(input) {
  const get = (key) => {
    const v = input?.[key];
    return typeof v === "string" ? v.trim() : "";
  };

  const normalized = {
    companyName: get("CRM Company Name"),
    estimatedBalanceDueRange: get("Estimated Balance Due Range"),
    firstName: get("CRM First Name"),
    irsMonitoringOnlyAcknowledged: get("IRS Monitoring Only Acknowledged"),
    irsNoticeDate: get("IRS Notice Date"),
    irsNoticeReceived: get("IRS Notice Received"),
    irsNoticeType: get("IRS Notice Type"),
    lastName: get("CRM Last Name"),
    primaryConcern: get("Primary Concern"),
    primaryEmail: get("CRM Primary Email"),
    unfiledReturnsIndicator: get("Unfiled Returns Indicator"),
    urgencyLevel: get("Urgency Level"),
  };

  const missing = [];
  if (!normalized.firstName) missing.push("CRM First Name");
  if (!normalized.lastName) missing.push("CRM Last Name");
  if (!normalized.primaryEmail) missing.push("CRM Primary Email");

  return { missing, normalized };
}

/* ------------------------------------------
 * Order Normalization
 * ------------------------------------------ */

function normalizeOrderPayload(input) {
  const get = (key) => {
    const v = input?.[key];
    return typeof v === "string" ? v.trim() : "";
  };

  const normalized = {
    orderToken: get("CF_Order Token") || get("Order Token") || get("orderToken"),
    orderType: get("Order Type") || get("orderType"),
    primaryEmail: get("CRM Primary Email") || get("Email") || get("email"),
    productName: get("Product Name") || get("Plan") || get("productName"),
    notes: get("Notes") || get("notes"),
  };

  const missing = [];
  if (!normalized.primaryEmail) missing.push("CRM Primary Email");
  if (!normalized.productName && !normalized.orderType) missing.push("Product Name");

  return { missing, normalized };
}

/* ------------------------------------------
 * Support Normalization
 * ------------------------------------------ */

function normalizeSupportPayload(input) {
  const get = (key) => {
    const v = input?.[key];
    return typeof v === "string" ? v.trim() : "";
  };

  const normalized = {
    issueType: get("CF_Support Issue Type") || get("Issue Type") || get("issueType"),
    orderToken: get("CF_Order Token") || get("Support Related Order ID") || get("orderToken"),
    primaryEmail: get("CF_Support Email") || get("CRM Primary Email") || get("Email") || get("email"),
    priority: get("CF_Support Priority") || get("Priority") || get("priority"),
    summary: get("Summary") || get("Message") || get("summary"),
  };

  const missing = [];
  if (!normalized.primaryEmail) missing.push("CF_Support Email");
  if (!normalized.summary) missing.push("Summary");

  return { missing, normalized };
}

/* ------------------------------------------
 * Ids + Throttle
 * ------------------------------------------ */

function isUuidLike(v) {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v.trim()
    )
  );
}

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

async function accountIdFromEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  const hex = await sha256Hex(e);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(
    17,
    20
  )}-${hex.slice(20, 32)}`;
}

function dayKeyUTC(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function enforceEmailThrottle(env, email, opts = {}) {
  const cooldownSeconds = Number(opts.cooldownSeconds ?? 600);
  const maxPerDay = Number(opts.maxPerDay ?? 3);
  const scope = String(opts.scope || "form:intake");

  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return { ok: true };

  const now = new Date();
  const nowIso = now.toISOString();
  const today = dayKeyUTC(now);

  const emailHash = await sha256Hex(cleanEmail);
  const throttleKey = `rate/${scope}/email/${emailHash}.json`;

  const existing = await readJsonR2(env, throttleKey);
  const lastAt = existing?.lastAt ? Date.parse(existing.lastAt) : 0;
  const sameDay = existing?.dayKey === today;

  const countToday = sameDay ? Number(existing?.countToday || 0) : 0;
  const secondsSinceLast = lastAt ? Math.floor((Date.now() - lastAt) / 1000) : Infinity;

  if (countToday >= maxPerDay) {
    return {
      ok: false,
      error: "Daily submission limit reached for this email.",
      retryAfterSeconds: 86400,
    };
  }

  if (secondsSinceLast < cooldownSeconds) {
    return {
      ok: false,
      error: "Please wait before submitting again.",
      retryAfterSeconds: cooldownSeconds - secondsSinceLast,
    };
  }

  const nextState = {
    countToday: countToday + 1,
    dayKey: today,
    lastAt: nowIso,
    scope,
    updatedAt: nowIso,
  };

  await writeJsonR2(env, throttleKey, nextState);

  return { ok: true };
}

/* ------------------------------------------
 * R2 Utilities
 * ------------------------------------------ */

async function readJsonR2(env, key) {
  const obj = await env.R2_BUCKET.get(key);
  if (!obj) return null;
  return await obj.json();
}

async function writeJsonR2(env, key, value) {
  await env.R2_BUCKET.put(key, JSON.stringify(value, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });
}

/* ------------------------------------------
 * ClickUp Utilities
 * ------------------------------------------ */

const CU_ACCOUNTS_CF = {
  accountFirstName: "f5c9f6da-c994-4733-a15f-59188b37f531",
  accountId: "e5f176ba-82c8-47d8-b3b1-0716d075f43f",
  accountLastName: "a348d629-fa05-45d8-a2dd-b909f78ddf49",
  accountOrderTaskLink: "4b22ab15-26f3-4f6f-98b5-7b4f5446e62d",
  accountPrimaryEmail: "a105f99e-b33d-4d12-bb24-f7c827ec761a",
  accountSupportTaskLink: "9e14a458-96fd-4109-a276-034d8270e15b",
};

async function clickUpRequest(env, path, options = {}) {
  if (!env.CLICKUP_API_KEY) throw new Error("Missing CLICKUP_API_KEY");

  const url = `https://api.clickup.com/api/v2${path}`;
  const headers = new Headers(options.headers || {});
  headers.set("authorization", env.CLICKUP_API_KEY);
  headers.set("content-type", "application/json");

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const parsed = tryParseJson(text);
  const body = parsed.ok ? parsed.value : { raw: text };

  if (!res.ok) {
    throw new Error(`ClickUp ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function addClickUpComment(env, taskId, commentText) {
  if (!taskId) return;

  await clickUpRequest(env, `/task/${taskId}/comment`, {
    method: "POST",
    body: JSON.stringify({
      comment_text: commentText,
      notify_all: false,
    }),
  });
}

async function setClickUpTaskCustomField(env, taskId, fieldId, value) {
  if (!taskId) return;
  if (!fieldId) return;

  await clickUpRequest(env, `/task/${taskId}/field/${fieldId}`, {
    method: "POST",
    body: JSON.stringify({ value }),
  });
}

async function createClickUpAccountTask(env, account, receipt) {
  if (!env.CLICKUP_ACCOUNTS_LIST_ID) throw new Error("Missing CLICKUP_ACCOUNTS_LIST_ID");

  const name = `Intake — ${account.firstName} ${account.lastName}`.trim();

  const description = [
    `Account: ${account.firstName} ${account.lastName}`.trim(),
    `Company: ${account.metadata?.companyName || "—"}`,
    `Email: ${account.primaryEmail}`,
    `Received: ${receipt.timestamp}`,
    `Trigger: ${receipt.source}:${receipt.type}`,
    ``,
    `R2 Keys:`,
    `- accounts/${account.accountId}.json`,
    `- receipts/form/${receipt.eventId}.json`,
    ``,
    `Submitted:`,
    `- Estimated Balance Due Range: ${account.metadata?.estimatedBalanceDueRange || "—"}`,
    `- IRS Notice Received: ${account.metadata?.irsNoticeReceived || "—"}`,
    `- IRS Notice Type: ${account.metadata?.irsNoticeType || "—"}`,
    `- IRS Notice Date: ${account.metadata?.irsNoticeDate || "—"}`,
    `- Primary Concern: ${account.metadata?.primaryConcern || "—"}`,
    `- Unfiled Returns Indicator: ${account.metadata?.unfiledReturnsIndicator || "—"}`,
    `- Urgency Level: ${account.metadata?.urgencyLevel || "—"}`,
  ].join("\n");

  const payload = {
    custom_fields: [
      { id: CU_ACCOUNTS_CF.accountFirstName, value: account.firstName || "" },
      { id: CU_ACCOUNTS_CF.accountId, value: account.accountId || "" },
      { id: CU_ACCOUNTS_CF.accountLastName, value: account.lastName || "" },
      { id: CU_ACCOUNTS_CF.accountPrimaryEmail, value: account.primaryEmail || "" },
    ],
    description,
    name,
    status: "Lead",
  };

  const created = await clickUpRequest(env, `/list/${env.CLICKUP_ACCOUNTS_LIST_ID}/task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return created?.id || null;
}

async function ensureClickUpAccountTask(env, account, accountKey, receipt) {
  const existingId = account?.clickUp?.accountTaskId || null;

  if (existingId) return existingId;
  if (!env.CLICKUP_API_KEY || !env.CLICKUP_ACCOUNTS_LIST_ID) return null;

  const createdId = await createClickUpAccountTask(env, account, receipt);

  const comment = [
    `tm_account=accounts/${account.accountId}.json`,
    `tm_accountId=${account.accountId}`,
    `tm_event=${receipt.source}:${receipt.type}`,
    `tm_eventId=${receipt.eventId}`,
    `tm_receipt=receipts/form/${receipt.eventId}.json`,
  ].join(" ");

  await addClickUpComment(env, createdId, comment);

  const patched = {
    ...account,
    clickUp: {
      ...(account.clickUp || {}),
      accountTaskId: createdId,
    },
  };

  await writeJsonR2(env, accountKey, patched);

  return createdId;
}

async function createClickUpOrderTask(env, account, order, receipt) {
  if (!env.CLICKUP_ORDERS_LIST_ID) throw new Error("Missing CLICKUP_ORDERS_LIST_ID");

  const name = `Order — ${account.firstName || ""} ${account.lastName || ""}`.trim() || `Order — ${account.accountId}`;

  const description = [
    `Account: ${account.firstName || ""} ${account.lastName || ""}`.trim(),
    `Account ID: ${account.accountId}`,
    `Email: ${account.primaryEmail || "—"}`,
    `Order ID: ${order.orderId}`,
    `Product/Plan: ${order.productName || "—"}`,
    `Type: ${order.orderType || "—"}`,
    `Received: ${receipt.timestamp}`,
    `Trigger: ${receipt.source}:${receipt.type}`,
    ``,
    `R2 Keys:`,
    `- accounts/${account.accountId}.json`,
    `- orders/${order.orderId}.json`,
    `- receipts/form/${receipt.eventId}.json`,
    ``,
    `Notes: ${order.notes || "—"}`,
  ].join("\n");

  const payload = {
    description,
    name,
    status: "New",
  };

  const created = await clickUpRequest(env, `/list/${env.CLICKUP_ORDERS_LIST_ID}/task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return created?.id || null;
}

async function createClickUpSupportTask(env, account, support, receipt) {
  if (!env.CLICKUP_SUPPORT_LIST_ID) throw new Error("Missing CLICKUP_SUPPORT_LIST_ID");

  const name =
    `Support — ${account.firstName || ""} ${account.lastName || ""}`.trim() || `Support — ${account.accountId}`;

  const description = [
    `Account: ${account.firstName || ""} ${account.lastName || ""}`.trim(),
    `Account ID: ${account.accountId}`,
    `Email: ${account.primaryEmail || "—"}`,
    `Support ID: ${support.supportId}`,
    `Issue Type: ${support.issueType || "—"}`,
    `Priority: ${support.priority || "—"}`,
    `Related Order Token: ${support.orderToken || "—"}`,
    `Received: ${receipt.timestamp}`,
    `Trigger: ${receipt.source}:${receipt.type}`,
    ``,
    `R2 Keys:`,
    `- accounts/${account.accountId}.json`,
    `- receipts/form/${receipt.eventId}.json`,
    `- support/${support.supportId}.json`,
    ``,
    `Summary:`,
    `${support.summary || "—"}`,
  ].join("\n");

  const payload = {
    description,
    name,
    status: "Open",
  };

  const created = await clickUpRequest(env, `/list/${env.CLICKUP_SUPPORT_LIST_ID}/task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return created?.id || null;
}

/* ------------------------------------------
 * Worker Entry
 * ------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && isPath(url, "/health")) {
      return jsonResponse({ ok: true, service: "taxmonitor-pro-api" }, { status: 200 });
    }

    if (isPath(url, "/cal/webhook")) return await handleCalWebhook(request, env, ctx);
    if (isPath(url, "/forms/intake")) return await handleFormsIntake(request, env, ctx);
    if (isPath(url, "/forms/order")) return await handleFormsOrder(request, env, ctx);
    if (isPath(url, "/forms/support")) return await handleFormsSupport(request, env, ctx);
    if (isPath(url, "/stripe/webhook")) return await handleStripeWebhook(request, env, ctx);

    return jsonResponse({ ok: false, error: "Not found" }, { status: 404 });
  },
};

/* ------------------------------------------
 * CAL (stub)
 * ------------------------------------------ */

async function handleCalWebhook(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }
  const rawBody = await readRawBody(request);
  const parsed = tryParseJson(rawBody);
  if (!parsed.ok) {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  console.log("[cal] webhook received", { keys: Object.keys(parsed.value || {}) });
  return jsonResponse({ ok: true }, { status: 200 });
}

/* ------------------------------------------
 * FORMS: Intake
 * ------------------------------------------ */

async function handleFormsIntake(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  if (!env.R2_BUCKET) {
    return jsonResponse({ ok: false, error: "R2_BUCKET binding missing." }, { status: 500 });
  }

  const parsed = await parseInboundBody(request);
  if (!parsed.ok) {
    return jsonResponse({ ok: false, error: parsed.error, details: parsed.details }, { status: 400 });
  }

  const { missing, normalized } = normalizeIntakePayload(parsed.data);
  if (missing.length) {
    return jsonResponse({ ok: false, error: "Missing required fields", missing }, { status: 400 });
  }

  const inboundEventId = parsed.data?.eventId;
  const eventId = isUuidLike(inboundEventId) ? inboundEventId.trim() : crypto.randomUUID();
  const receiptKey = `receipts/form/${eventId}.json`;

  const existingReceipt = await readJsonR2(env, receiptKey);
  if (existingReceipt && existingReceipt.processed === true) {
    return jsonResponse({ ok: true, idempotent: true, eventId }, { status: 200 });
  }

  const throttle = await enforceEmailThrottle(env, normalized.primaryEmail, {
    cooldownSeconds: 600,
    maxPerDay: 3,
    scope: "form:intake",
  });

  if (!throttle.ok) {
    return jsonResponse(
      { ok: false, error: throttle.error },
      {
        status: 429,
        headers: { "Retry-After": String(throttle.retryAfterSeconds || 60) },
      }
    );
  }

  const accountId = await accountIdFromEmail(normalized.primaryEmail);
  const accountKey = `accounts/${accountId}.json`;

  const receipt = {
    accountId,
    eventId,
    source: "form",
    type: "intake",
    timestamp: new Date().toISOString(),
    rawPayload: { ...parsed.data, eventId },
    normalizedPayload: normalized,
    processed: false,
    processingError: null,
  };

  await writeJsonR2(env, receiptKey, receipt);

  try {
    const existingAccount = await readJsonR2(env, accountKey);

    const account = {
      accountId,
      activeOrders: Array.isArray(existingAccount?.activeOrders) ? existingAccount.activeOrders : [],
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      lifecycleState: "intake_submitted",
      metadata: {
        companyName: normalized.companyName,
        estimatedBalanceDueRange: normalized.estimatedBalanceDueRange,
        irsMonitoringOnlyAcknowledged: normalized.irsMonitoringOnlyAcknowledged,
        irsNoticeDate: normalized.irsNoticeDate,
        irsNoticeReceived: normalized.irsNoticeReceived,
        irsNoticeType: normalized.irsNoticeType,
        primaryConcern: normalized.primaryConcern,
        unfiledReturnsIndicator: normalized.unfiledReturnsIndicator,
        urgencyLevel: normalized.urgencyLevel,
      },
      primaryEmail: normalized.primaryEmail,
      stripeCustomerId: existingAccount?.stripeCustomerId || null,
      clickUp: {
        ...(existingAccount?.clickUp || {}),
      },
    };

    await writeJsonR2(env, accountKey, account);

    let clickUpTaskId = null;
    if (env.CLICKUP_API_KEY && env.CLICKUP_ACCOUNTS_LIST_ID) {
      clickUpTaskId = await ensureClickUpAccountTask(env, account, accountKey, receipt);
    }

    receipt.processed = true;
    receipt.processingError = null;
    receipt.clickUpTaskId = clickUpTaskId;

    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      {
        ok: true,
        accountId,
        clickUpTaskId,
        eventId,
        message: "Intake processed: receipt + canonical + ClickUp.",
        receivedAs: parsed.type,
      },
      { status: 200 }
    );
  } catch (err) {
    receipt.processed = false;
    receipt.processingError = String(err?.message || err);
    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      { ok: false, error: "Intake processing failed", eventId, details: receipt.processingError },
      { status: 500 }
    );
  }
}

/* ------------------------------------------
 * FORMS: Order
 * ------------------------------------------ */

async function handleFormsOrder(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  if (!env.R2_BUCKET) {
    return jsonResponse({ ok: false, error: "R2_BUCKET binding missing." }, { status: 500 });
  }

  const parsed = await parseInboundBody(request);
  if (!parsed.ok) {
    return jsonResponse({ ok: false, error: parsed.error, details: parsed.details }, { status: 400 });
  }

  const { missing, normalized } = normalizeOrderPayload(parsed.data);
  if (missing.length) {
    return jsonResponse({ ok: false, error: "Missing required fields", missing }, { status: 400 });
  }

  const inboundEventId = parsed.data?.eventId;
  const eventId = isUuidLike(inboundEventId) ? inboundEventId.trim() : crypto.randomUUID();
  const receiptKey = `receipts/form/${eventId}.json`;

  const existingReceipt = await readJsonR2(env, receiptKey);
  if (existingReceipt && existingReceipt.processed === true) {
    return jsonResponse({ ok: true, idempotent: true, eventId }, { status: 200 });
  }

  const throttle = await enforceEmailThrottle(env, normalized.primaryEmail, {
    cooldownSeconds: 600,
    maxPerDay: 10,
    scope: "form:order",
  });

  if (!throttle.ok) {
    return jsonResponse(
      { ok: false, error: throttle.error },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds || 60) } }
    );
  }

  const accountId = await accountIdFromEmail(normalized.primaryEmail);
  const accountKey = `accounts/${accountId}.json`;

  const orderId = normalized.orderToken || eventId;
  const orderKey = `orders/${orderId}.json`;

  const receipt = {
    accountId,
    eventId,
    source: "form",
    type: "order",
    timestamp: new Date().toISOString(),
    rawPayload: { ...parsed.data, eventId },
    normalizedPayload: normalized,
    processed: false,
    processingError: null,
  };

  await writeJsonR2(env, receiptKey, receipt);

  try {
    const existingAccount = await readJsonR2(env, accountKey);
    if (!existingAccount) {
      throw new Error("Account not found for email. Submit intake first or create account before order.");
    }

    const order = {
      accountId,
      createdAt: new Date().toISOString(),
      orderId,
      orderType: normalized.orderType || null,
      productName: normalized.productName || null,
      notes: normalized.notes || null,
      status: "order_submitted",
    };

    await writeJsonR2(env, orderKey, order);

    const account = {
      ...existingAccount,
      activeOrders: Array.isArray(existingAccount?.activeOrders)
        ? Array.from(new Set([...(existingAccount.activeOrders || []), orderId]))
        : [orderId],
    };

    await writeJsonR2(env, accountKey, account);

    let orderTaskId = null;
    let accountTaskId = null;

    if (env.CLICKUP_API_KEY) {
      accountTaskId = await ensureClickUpAccountTask(env, account, accountKey, receipt);

      if (env.CLICKUP_ORDERS_LIST_ID) {
        orderTaskId = await createClickUpOrderTask(env, account, order, receipt);

        const comment = [
          `tm_account=accounts/${account.accountId}.json`,
          `tm_accountId=${account.accountId}`,
          `tm_event=${receipt.source}:${receipt.type}`,
          `tm_eventId=${receipt.eventId}`,
          `tm_order=orders/${order.orderId}.json`,
          `tm_receipt=receipts/form/${receipt.eventId}.json`,
        ].join(" ");

        await addClickUpComment(env, orderTaskId, comment);

        await setClickUpTaskCustomField(
          env,
          accountTaskId,
          CU_ACCOUNTS_CF.accountOrderTaskLink,
          [orderTaskId]
        );
      }
    }

    receipt.processed = true;
    receipt.processingError = null;
    receipt.clickUpTaskId = orderTaskId;

    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      {
        ok: true,
        accountId,
        eventId,
        orderId,
        orderTaskId,
        message: "Order processed: receipt + canonical + ClickUp.",
        receivedAs: parsed.type,
      },
      { status: 200 }
    );
  } catch (err) {
    receipt.processed = false;
    receipt.processingError = String(err?.message || err);
    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      { ok: false, error: "Order processing failed", eventId, details: receipt.processingError },
      { status: 500 }
    );
  }
}

/* ------------------------------------------
 * FORMS: Support
 * ------------------------------------------ */

async function handleFormsSupport(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  if (!env.R2_BUCKET) {
    return jsonResponse({ ok: false, error: "R2_BUCKET binding missing." }, { status: 500 });
  }

  const parsed = await parseInboundBody(request);
  if (!parsed.ok) {
    return jsonResponse({ ok: false, error: parsed.error, details: parsed.details }, { status: 400 });
  }

  const { missing, normalized } = normalizeSupportPayload(parsed.data);
  if (missing.length) {
    return jsonResponse({ ok: false, error: "Missing required fields", missing }, { status: 400 });
  }

  const inboundEventId = parsed.data?.eventId;
  const eventId = isUuidLike(inboundEventId) ? inboundEventId.trim() : crypto.randomUUID();
  const receiptKey = `receipts/form/${eventId}.json`;

  const existingReceipt = await readJsonR2(env, receiptKey);
  if (existingReceipt && existingReceipt.processed === true) {
    return jsonResponse({ ok: true, idempotent: true, eventId }, { status: 200 });
  }

  const throttle = await enforceEmailThrottle(env, normalized.primaryEmail, {
    cooldownSeconds: 120,
    maxPerDay: 25,
    scope: "form:support",
  });

  if (!throttle.ok) {
    return jsonResponse(
      { ok: false, error: throttle.error },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds || 60) } }
    );
  }

  const accountId = await accountIdFromEmail(normalized.primaryEmail);
  const accountKey = `accounts/${accountId}.json`;

  const supportId = eventId;
  const supportKey = `support/${supportId}.json`;

  const receipt = {
    accountId,
    eventId,
    source: "form",
    type: "support",
    timestamp: new Date().toISOString(),
    rawPayload: { ...parsed.data, eventId },
    normalizedPayload: normalized,
    processed: false,
    processingError: null,
  };

  await writeJsonR2(env, receiptKey, receipt);

  try {
    const existingAccount = await readJsonR2(env, accountKey);
    if (!existingAccount) {
      throw new Error("Account not found for email. Submit intake first or create account before support.");
    }

    const support = {
      accountId,
      createdAt: new Date().toISOString(),
      issueType: normalized.issueType || null,
      orderToken: normalized.orderToken || null,
      priority: normalized.priority || null,
      status: "support_submitted",
      summary: normalized.summary || null,
      supportId,
    };

    await writeJsonR2(env, supportKey, support);

    const account = { ...existingAccount };

    let supportTaskId = null;
    let accountTaskId = null;

    if (env.CLICKUP_API_KEY) {
      accountTaskId = await ensureClickUpAccountTask(env, account, accountKey, receipt);

      if (env.CLICKUP_SUPPORT_LIST_ID) {
        supportTaskId = await createClickUpSupportTask(env, account, support, receipt);

        const comment = [
          `tm_account=accounts/${account.accountId}.json`,
          `tm_accountId=${account.accountId}`,
          `tm_event=${receipt.source}:${receipt.type}`,
          `tm_eventId=${receipt.eventId}`,
          `tm_receipt=receipts/form/${receipt.eventId}.json`,
          `tm_support=support/${support.supportId}.json`,
        ].join(" ");

        await addClickUpComment(env, supportTaskId, comment);

        await setClickUpTaskCustomField(
          env,
          accountTaskId,
          CU_ACCOUNTS_CF.accountSupportTaskLink,
          [supportTaskId]
        );
      }
    }

    receipt.processed = true;
    receipt.processingError = null;
    receipt.clickUpTaskId = supportTaskId;

    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      {
        ok: true,
        accountId,
        eventId,
        supportId,
        supportTaskId,
        message: "Support processed: receipt + canonical + ClickUp.",
        receivedAs: parsed.type,
      },
      { status: 200 }
    );
  } catch (err) {
    receipt.processed = false;
    receipt.processingError = String(err?.message || err);
    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      { ok: false, error: "Support processing failed", eventId, details: receipt.processingError },
      { status: 500 }
    );
  }
}

/* ------------------------------------------
 * STRIPE (stub)
 * ------------------------------------------ */

async function handleStripeWebhook(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }
  const rawBody = await readRawBody(request);
  const parsed = tryParseJson(rawBody);
  if (!parsed.ok) {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  console.log("[stripe] webhook received", { type: parsed.value?.type, id: parsed.value?.id });
  return jsonResponse({ ok: true }, { status: 200 });
}
