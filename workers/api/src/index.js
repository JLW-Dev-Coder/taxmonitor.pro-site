/**
 * Tax Monitor Pro — Cloudflare Worker (API + Orchestration)
 *
 * Architecture principle:
 * - R2 is the authority (system of record)
 * - Worker is the logic plane
 * - ClickUp is execution
 * - Pages is presentation
 *
 * This Worker currently exposes these inbound routes:
 * - GET  /health
 * - POST /cal/webhook
 * - POST /stripe/webhook
 * - POST /forms/intake
 *
 * Notes:
 * - This file is intentionally “from scratch” and heavily commented.
 * - Each major route group has a large, hard-to-miss header block.
 * - Receipts Ledger is implemented for /forms/intake only (first layer).
 */

/**
 * Environment bindings (documented for clarity)
 *
 * Secrets (expected):
 * - CAL_WEBHOOK_SECRET
 * - STRIPE_WEBHOOK_SECRET
 * - STRIPE_SECRET_KEY (optional)
 * - CLICKUP_TOKEN (optional)
 *
 * R2 bindings (required for /forms/intake receipts):
 * - R2_BUCKET (R2 bucket binding name)
 */

/* ------------------------------------------
 * Utilities
 * ------------------------------------------ */

/**
 * Read request body safely.
 * - For webhook signature verification you MUST use the raw text.
 * - We parse JSON only after capturing the raw body.
 */
async function readRawBody(request) {
  return await request.text();
}

/**
 * Safe JSON parse helper.
 * Returns:
 * - { ok: true, value }
 * - { ok: false, error }
 */
function tryParseJson(raw) {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Standard JSON response helper.
 */
function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

/**
 * Method guard.
 */
function requireMethod(request, allowed) {
  const method = request.method.toUpperCase();
  return allowed.includes(method);
}

/**
 * Route matching helper.
 * Matches exact pathname (no params).
 */
function isPath(url, pathname) {
  return url.pathname === pathname;
}

/* ------------------------------------------
 * Body Parsing (Forms + JSON)
 * ------------------------------------------ */

/**
 * Parse inbound form submissions in a consistent way.
 *
 * Supports:
 * - application/json
 * - application/x-www-form-urlencoded
 * - multipart/form-data
 */
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

  // Default: treat as HTML form submission
  try {
    const fd = await request.formData();
    const data = {};
    for (const [k, v] of fd.entries()) {
      // v can be string or File; intake expects strings.
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

/**
 * Normalize intake payload into consistent internal keys.
 * This lets HTML forms keep human labels while the Worker uses stable fields.
 */
function normalizeIntakePayload(input) {
  const get = (key) => {
    const v = input?.[key];
    return typeof v === "string" ? v.trim() : "";
  };

  // Map current HTML form field names -> internal keys
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
 * R2 Receipts Ledger Utilities
 * ------------------------------------------ */

/**
 * Read receipt from R2 (JSON).
 */
async function readReceipt(env, key) {
  const obj = await env.R2_BUCKET.get(key);
  if (!obj) return null;
  return await obj.json();
}

/**
 * Write receipt object to R2 (JSON).
 */
async function writeReceipt(env, key, receipt) {
  await env.R2_BUCKET.put(key, JSON.stringify(receipt, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });
}

/* ------------------------------------------
 * Worker Entry
 * ------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Minimal health check (useful for verifying routing)
    if (request.method === "GET" && isPath(url, "/health")) {
      return jsonResponse({ ok: true, service: "taxmonitor-pro-api" }, { status: 200 });
    }

    // Route dispatch
    if (isPath(url, "/cal/webhook")) {
      return await handleCalWebhook(request, env, ctx);
    }

    if (isPath(url, "/forms/intake")) {
      return await handleFormsIntake(request, env, ctx);
    }

    if (isPath(url, "/stripe/webhook")) {
      return await handleStripeWebhook(request, env, ctx);
    }

    return jsonResponse({ ok: false, error: "Not found" }, { status: 404 });
  },
};

/* **********************************************************************************************
 * CAL.COM ROUTE
 * This route relates to the Cal.com (Bookings) part of the architecture.
 *
 * Path:
 * - POST /cal/webhook
 *
 * Responsibilities (in order):
 * 1) Verify webhook authenticity (signature) using CAL_WEBHOOK_SECRET
 * 2) Write receipt to R2 (append-only) BEFORE any downstream effects
 * 3) Upsert canonical domain object(s) in R2 (accounts/support/orders as needed)
 * 4) Project operational state into ClickUp (create/update tasks)
 ********************************************************************************************** */

async function handleCalWebhook(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const rawBody = await readRawBody(request);

  // IMPLEMENTATION REQUIRED:
  // Cal.com signature verification must be implemented before production.
  // If verification fails:
  // return jsonResponse({ ok: false, error: "Invalid signature" }, { status: 401 });

  const parsed = tryParseJson(rawBody);
  if (!parsed.ok) {
    return jsonResponse(
      { ok: false, error: "Invalid JSON", details: String(parsed.error?.message || parsed.error) },
      { status: 400 }
    );
  }

  console.log("[cal] webhook received", { keys: Object.keys(parsed.value || {}) });

  return jsonResponse({ ok: true }, { status: 200 });
}

/* **********************************************************************************************
 * ONLINE FORMS ROUTES
 * This route group relates to Online Forms (Lifecycle + Post-Payment) part of the architecture.
 *
 * Implemented in this step:
 * - POST /forms/intake
 ********************************************************************************************** */

/* **********************************************************************************************
 * INTAKE ROUTE
 * This route relates to the Intake form (pre-payment) part of the architecture.
 *
 * Path:
 * - POST /forms/intake
 *
 * Responsibilities (in order):
 * 1) Validate payload (required fields)
 * 2) Write receipt to R2 (append-only) BEFORE any downstream effects
 * 3) Upsert canonical account/order objects in R2 (future step)
 * 4) Project operational state into ClickUp (future step)
 ********************************************************************************************** */

async function handleFormsIntake(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  // Binding guard (fails loud and early)
  if (!env.R2_BUCKET) {
    return jsonResponse(
      { ok: false, error: "R2_BUCKET binding missing. Configure wrangler.toml + Cloudflare binding." },
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

  const eventId = crypto.randomUUID();
  const receiptKey = `receipts/form/${eventId}.json`;

  // Idempotency check (UUID collision is effectively impossible, but ledger semantics are consistent)
  const existing = await readReceipt(env, receiptKey);
  if (existing && existing.processed === true) {
    return jsonResponse({ ok: true, idempotent: true, eventId }, { status: 200 });
  }

  const receipt = {
    eventId,
    source: "form",
    type: "intake",
    timestamp: new Date().toISOString(),
    rawPayload: parsed.data,
    normalizedPayload: normalized,
    processed: false,
    processingError: null,
  };

  // STEP 1: Write receipt (R2 FIRST)
  await writeReceipt(env, receiptKey, receipt);

  // STEP 2: Mark receipt processed (no downstream actions yet)
  receipt.processed = true;
  await writeReceipt(env, receiptKey, receipt);

  return jsonResponse(
    {
      ok: true,
      eventId,
      receivedAs: parsed.type, // "form" | "json"
      message: "Intake receipt recorded.",
    },
    { status: 200 }
  );
}

/* **********************************************************************************************
 * STRIPE ROUTE
 * This route relates to the Stripe (Payments) part of the architecture.
 *
 * Path:
 * - POST /stripe/webhook
 *
 * Responsibilities (in order):
 * 1) Verify webhook authenticity using STRIPE_WEBHOOK_SECRET
 * 2) Write receipt to R2 (append-only) BEFORE any downstream effects
 * 3) Upsert canonical domain object(s) in R2 (accounts/orders)
 * 4) Project operational state into ClickUp (create/update tasks + statuses)
 ********************************************************************************************** */

async function handleStripeWebhook(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return jsonResponse({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const rawBody = await readRawBody(request);

  // IMPLEMENTATION REQUIRED:
  // Stripe signature verification must be implemented before production.
  // If verification fails:
  // return jsonResponse({ ok: false, error: "Invalid signature" }, { status: 401 });

  const parsed = tryParseJson(rawBody);
  if (!parsed.ok) {
    return jsonResponse(
      { ok: false, error: "Invalid JSON", details: String(parsed.error?.message || parsed.error) },
      { status: 400 }
    );
  }

  console.log("[stripe] webhook received", { type: parsed.value?.type, id: parsed.value?.id });

  return jsonResponse({ ok: true }, { status: 200 });
}
