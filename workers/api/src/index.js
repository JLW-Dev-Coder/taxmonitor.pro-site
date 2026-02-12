/**
 * Tax Monitor Pro — Cloudflare Worker (API + Orchestration)
 *
 * Architecture principle:
 * - R2 is the authority (system of record)
 * - Worker is the logic plane
 * - ClickUp is execution
 * - Pages is presentation
 *
 * This Worker currently exposes ONLY these inbound webhook routes:
 * - POST /cal/webhook
 * - POST /stripe/webhook
 *
 * Notes:
 * - This file is intentionally “from scratch” and heavily commented.
 * - Each major route group has a large, hard-to-miss header block.
 * - Add /forms/* routes only after Cal + Stripe are stable.
 */

/**
 * Environment bindings (documented for clarity)
 *
 * Secrets (expected):
 * - CAL_WEBHOOK_SECRET
 * - STRIPE_WEBHOOK_SECRET
 * - STRIPE_SECRET_KEY (if you call Stripe API, optional)
 * - CLICKUP_TOKEN (if you call ClickUp API, optional)
 *
 * R2 bindings (expected later):
 * - R2_BUCKET (R2 binding name)
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
    // Keep dispatch blocks minimal and push logic into handlers.
    if (isPath(url, "/cal/webhook")) {
      return await handleCalWebhook(request, env, ctx);
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

  // TODO: Implement Cal.com signature verification.
  // - Cal signature header name depends on your Cal.com webhook config.
  // - Verify using env.CAL_WEBHOOK_SECRET and the raw body.
  //
  // If verification fails:
  // return jsonResponse({ ok: false, error: "Invalid signature" }, { status: 401 });

  const parsed = tryParseJson(rawBody);
  if (!parsed.ok) {
    return jsonResponse(
      { ok: false, error: "Invalid JSON", details: String(parsed.error?.message || parsed.error) },
      { status: 400 }
    );
  }

  // Placeholder logic (replace with real pipeline):
  // - writeReceiptToR2(...)
  // - upsertSupportOrAccountInR2(...)
  // - upsertClickUpTask(...)
  console.log("[cal] webhook received", {
    keys: Object.keys(parsed.value || {}),
  });

  return jsonResponse({ ok: true }, { status: 200 });
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

  // TODO: Implement Stripe signature verification.
  // - Use the "Stripe-Signature" header + env.STRIPE_WEBHOOK_SECRET.
  // - Stripe verification must use raw body bytes.
  //
  // If verification fails:
  // return jsonResponse({ ok: false, error: "Invalid signature" }, { status: 401 });

  const parsed = tryParseJson(rawBody);
  if (!parsed.ok) {
    return jsonResponse(
      { ok: false, error: "Invalid JSON", details: String(parsed.error?.message || parsed.error) },
      { status: 400 }
    );
  }

  // Placeholder logic (replace with real pipeline):
  // - writeReceiptToR2(...)
  // - upsertAccountAndOrderInR2(...)
  // - upsertClickUpOrderTask(...)
  // - set Stripe fields in ClickUp (Session ID, Customer ID, Payment Status, Payment URL)
  console.log("[stripe] webhook received", {
    type: parsed.value?.type,
    id: parsed.value?.id,
  });

  return jsonResponse({ ok: true }, { status: 200 });
}

/* **********************************************************************************************
 * FUTURE: ONLINE FORMS ROUTES
 * This route group relates to Online Forms (Lifecycle + Post-Payment) part of the architecture.
 *
 * Recommended paths (alphabetical):
 * - POST /forms/address-update
 * - POST /forms/agreement
 * - POST /forms/client-exit-survey
 * - POST /forms/compliance-report
 * - POST /forms/esign-2848
 * - POST /forms/filing-status
 * - POST /forms/intake
 * - POST /forms/offer
 * - POST /forms/payment
 * - POST /forms/welcome
 *
 * These are intentionally not implemented in this “Cal + Stripe first” baseline.
 ********************************************************************************************** */
