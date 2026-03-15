/**
 * Tax Monitor Pro — Cloudflare Worker
 *
 * Routes:
 * - GET  /api/pricing
 * - GET  /health
 * - GET  /v1/pricing
 *
 * Notes:
 * - This Worker is the main TMP Worker.
 * - Transcript TMP has its own separate Worker and routes.
 * - This file only exposes read-only TOML-backed pricing for the pricing page.
 * - /api/pricing is kept as a compatibility alias for the current frontend fetch.
 */

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function isPath(url, pathname) {
  return url.pathname === pathname;
}

function withCors(request, headers = {}) {
  const origin = request.headers.get("origin") || "";
  const allowed = new Set([
    "https://taxmonitor.pro",
    "https://www.taxmonitor.pro",
  ]);

  return {
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-origin": allowed.has(origin) ? origin : "https://taxmonitor.pro",
    "access-control-max-age": "86400",
    ...headers,
  };
}

function handleCorsPreflight(request) {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: withCors(request) });
}

function toNumber(value, fallback = 0) {
  const raw = typeof value === "string" ? value.trim() : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value, fallback = 0) {
  const raw = typeof value === "string" ? value.trim() : value;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/* ------------------------------------------
 * TMP Pricing
 * ------------------------------------------ */

function buildTmpPricing(env) {
  return {
    essential: {
      monthly: toNumber(env.TMP_PLAN_ESSENTIAL_MONTHLY_PRICE, 0),
      taxToolTokens: toInteger(env.TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS, 0),
      transcriptTokens: toInteger(env.TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS, 0),
      yearly: toNumber(env.TMP_PLAN_ESSENTIAL_YEARLY_PRICE, 0),
    },
    free: {
      monthly: 0,
      taxToolTokens: toInteger(env.TMP_PLAN_FREE_TAX_TOOL_TOKENS, 0),
      transcriptTokens: toInteger(env.TMP_PLAN_FREE_TRANSCRIPT_TOKENS, 0),
      yearly: 0,
    },
    plus: {
      monthly: toNumber(env.TMP_PLAN_PLUS_MONTHLY_PRICE, 0),
      taxToolTokens: toInteger(env.TMP_PLAN_PLUS_TAX_TOOL_TOKENS, 0),
      transcriptTokens: toInteger(env.TMP_PLAN_PLUS_TRANSCRIPT_TOKENS, 0),
      yearly: toNumber(env.TMP_PLAN_PLUS_YEARLY_PRICE, 0),
    },
    premier: {
      monthly: toNumber(env.TMP_PLAN_PREMIER_MONTHLY_PRICE, 0),
      taxToolTokens: toInteger(env.TMP_PLAN_PREMIER_TAX_TOOL_TOKENS, 0),
      transcriptTokens: toInteger(env.TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS, 0),
      yearly: toNumber(env.TMP_PLAN_PREMIER_YEARLY_PRICE, 0),
    },
  };
}

function buildTmpPricingPublicResponse(env, { includeStripeIds = false } = {}) {
  const pricing = buildTmpPricing(env);

  if (!includeStripeIds) return pricing;

  return {
    ...pricing,
    stripePriceIds: {
      essential: {
        monthly: String(env.STRIPE_TMP_PRICE_ESSENTIAL_MONTHLY || ""),
        yearly: String(env.STRIPE_TMP_PRICE_ESSENTIAL_YEARLY || ""),
      },
      free: {
        monthly: String(env.STRIPE_TMP_PRICE_FREE_MONTHLY || ""),
        yearly: "",
      },
      plus: {
        monthly: String(env.STRIPE_TMP_PRICE_PLUS_MONTHLY || ""),
        yearly: String(env.STRIPE_TMP_PRICE_PLUS_YEARLY || ""),
      },
      premier: {
        monthly: String(env.STRIPE_TMP_PRICE_PREMIER_MONTHLY || ""),
        yearly: String(env.STRIPE_TMP_PRICE_PREMIER_YEARLY || ""),
      },
    },
  };
}

async function handleGetTmpPricing(request, env) {
  const url = new URL(request.url);
  const includeStripeIds = url.searchParams.get("includeStripeIds") === "1";
  const data = buildTmpPricingPublicResponse(env, { includeStripeIds });

  return json(data, 200, {
    "cache-control": "public, max-age=300",
    ...withCors(request),
  });
}


/* ------------------------------------------
 * Worker Entry
 * ------------------------------------------ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const pre = handleCorsPreflight(request);
    if (pre && (isPath(url, "/v1/pricing") || isPath(url, "/api/pricing"))) {
      return pre;
    }

    if (
      request.method === "GET" &&
      (isPath(url, "/v1/pricing") || isPath(url, "/api/pricing"))
    ) {
      return await handleGetTmpPricing(request, env);
    }

    if (request.method === "GET" && isPath(url, "/health")) {
      return jsonResponse({ ok: true, service: "tax-monitor-pro-api" }, { status: 200 });
    }

    return jsonResponse({ ok: false, error: "Not found" }, { status: 404 });
  },
};
