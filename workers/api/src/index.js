/**
 * Tax Monitor Pro — Cloudflare Worker (API + Orchestration)
 *
 * Inbound routes:
 * - GET  /health
 * - POST /cal/webhook
 * - POST /stripe/webhook
 * - POST /forms/intake
 *
 * Implemented:
 * - Receipts ledger (append-only)
 * - Canonical account upsert for intake
 * - ClickUp projection for intake (Accounts list)
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
 * Ids
 * ------------------------------------------ */

function isUuidLike(v) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
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
  // Deterministic UUID-ish from hash (stable, not random)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
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

async function createClickUpAccountTask(env, account, receipt) {
  if (!env.CLICKUP_ACCOUNTS_LIST_ID) throw new Error("Missing CLICKUP_ACCOUNTS_LIST_ID");

  const name = `Intake — ${account.firstName} ${account.lastName}`.trim();
  const descriptionLines = [
    `Source: form`,
    `Type: intake`,
    `Event ID: ${receipt.eventId}`,
    `Primary Email: ${account.primaryEmail}`,
    `Company: ${account.metadata?.companyName || ""}`.trim(),
  ].filter(Boolean);

  const payload = {
    name,
    description: descriptionLines.join("\n"),
    // Accounts pipeline status per README (lifecycle)
    status: "Lead",
  };

  const created = await clickUpRequest(
    env,
    `/list/${env.CLICKUP_ACCOUNTS_LIST_ID}/task`,
    { method: "POST", body: JSON.stringify(payload) }
  );

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
    return jsonResponse(
      { ok: false, error: "R2_BUCKET binding missing." },
      { status: 500 }
    );
  }

  const parsed = await parseInboundBody(request);
  if (!parsed.ok) {
    return jsonResponse({ ok: false, error: parsed.error, details: parsed.details }, { status: 400 });
  }

  const { missing, normalized } = normalizeIntakePayload(parsed.data);
  if (missing.length) {
    return jsonResponse({ ok: false, error: "Missing required fields", missing }, { status: 400 });
  }

  // Anti-spam: email-based throttling (cooldown + daily cap)
  // NOTE: requires enforceEmailThrottle(...) helper to exist elsewhere in this file.
  const throttle = await enforceEmailThrottle(env, normalized.primaryEmail, {
    cooldownSeconds: 600, // 10 minutes
    maxPerDay: 3,         // 3 submissions/day per email
  });

  if (!throttle.ok) {
    return jsonResponse(
      { ok: false, error: throttle.error },
      {
        status: 429,
        headers: {
          "Retry-After": String(throttle.retryAfterSeconds || 60),
        },
      }
    );
  }

  // Use inbound eventId if present, otherwise generate
  const inboundEventId = parsed.data?.eventId;
  const eventId = isUuidLike(inboundEventId) ? inboundEventId.trim() : crypto.randomUUID();

  const receiptKey = `receipts/form/${eventId}.json`;

  // True idempotency: if receipt exists and processed, return without side effects
  const existingReceipt = await readJsonR2(env, receiptKey);
  if (existingReceipt && existingReceipt.processed === true) {
    return jsonResponse({ ok: true, idempotent: true, eventId }, { status: 200 });
  }

  const accountId = await accountIdFromEmail(normalized.primaryEmail);
  const accountKey = `accounts/${accountId}.json`;

  const receipt = {
    accountId,
    eventId,
    source: "form",
    type: "intake",
    timestamp: new Date().toISOString(),
    rawPayload: {
      ...parsed.data,
      eventId, // force alignment so rawPayload and receipt agree
    },
    normalizedPayload: normalized,
    processed: false,
    processingError: null,
  };

  // 1) Write receipt (append-only ledger)
  await writeJsonR2(env, receiptKey, receipt);

  try {
    // 2) Upsert canonical account (R2 authority)
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
    };

    await writeJsonR2(env, accountKey, account);

    // 3) ClickUp projection (after R2 update)
    let clickUpTaskId = null;
    if (env.CLICKUP_API_KEY && env.CLICKUP_ACCOUNTS_LIST_ID) {
      clickUpTaskId = await createClickUpAccountTask(env, account, receipt);

      const comment = [
        `tm_account=accounts/${account.accountId}.json`,
        `tm_accountId=${account.accountId}`,
        `tm_event=form:intake`,
        `tm_eventId=${receipt.eventId}`,
        `tm_receipt=receipts/form/${receipt.eventId}.json`,
      ].join(" ");

      await addClickUpComment(env, clickUpTaskId, comment);
    }

    // 4) Mark receipt processed
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


