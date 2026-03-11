/**
 * Transcript Tax Monitor Pro — Cloudflare Worker
 *
 * Routes:
 * - GET  /health
 * - GET  /transcript/prices
 * - POST /transcript/checkout
 * - GET  /transcript/tokens?tokenId=...
 * - POST /transcript/consume
 * - POST /transcript/stripe/webhook
 * - GET  /assets/report?r=...
 * - POST /forms/transcript/report-email
 * - GET  /transcript/report-link?reportId=...
 * - GET  /assets/report?r=...
 *
 * Notes:
 * - Extracted from the mixed Tax Monitor Pro Worker.
 * - Keeps existing Stripe, Durable Object, Gmail, and transcript receipt behavior.
 * - Non-transcript routes intentionally removed.
 */

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

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

function requireMethod(request, allowed) {
  const method = request.method.toUpperCase();
  return allowed.includes(method);
}

function isPath(url, pathname) {
  return url.pathname === pathname;
}

function withCors(request, headers = {}) {
  const origin = request.headers.get("origin") || "";
  const allowed = new Set(["https://taxmonitor.pro", "https://transcript.taxmonitor.pro"]);

  return {
    "access-control-allow-headers": "content-type, stripe-signature",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": allowed.has(origin) ? origin : "https://transcript.taxmonitor.pro",
    "access-control-max-age": "86400",
    ...headers,
  };
}

function handleCorsPreflight(request) {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: withCors(request) });
}

/* ------------------------------------------
 * Transcript: Report Email helpers (CORS + Gmail)
 * ------------------------------------------ */

function corsHeadersForRequest(req) {
  const origin = req.headers.get("Origin") || "";
  const allowed = ["https://transcript.taxmonitor.pro"];

  if (!origin) return {};
  const ok = allowed.includes(origin);

  return {
    "Access-Control-Allow-Credentials": "false",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Origin": ok ? origin : "null",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function isLikelyEmail(v) {
  const s = String(v || "").trim().toLowerCase();
  if (!s || s.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isTokenIdFormat(v) {
  const s = String(v || "").trim();
  return /^[A-Za-z0-9_-]{8,128}$/.test(s);
}

function isSafeReportUrl(v) {
  const s = String(v || "").trim();
  if (!s) return false;

  let url;
  try {
    url = new URL(s);
  } catch {
    return false;
  }

  if (url.origin !== "https://transcript.taxmonitor.pro") return false;

  const allowedPaths = new Set([
    "/assets/report",
    "/assets/report.html",
    "/assets/report-preview.html",
  ]);

  if (!allowedPaths.has(url.pathname)) return false;

  const hasShortId = !!url.searchParams.get("r");
  const hasHash = !!(url.hash && url.hash.slice(1).trim());
  const hasPayloadQuery = !!(
    (url.searchParams.get("data") || "").trim() ||
    (url.searchParams.get("payload") || "").trim()
  );

  return hasShortId || hasHash || hasPayloadQuery;
}



async function getShortReportLink(env, reportId) {
  const stored = await resolveShortReportPayload(env, reportId);
  if (!stored || !stored.payload) return null;

  const target = new URL("https://transcript.taxmonitor.pro/assets/report.html");

  if (String(stored.payloadTransport || "hash") === "query") {
    target.searchParams.set("data", String(stored.payload));
  } else {
    target.hash = String(stored.payload);
  }

  return {
    reportId: String(reportId || "").trim(),
    reportUrl: target.toString(),
  };
}

function getReportKv(env) {
  // Canonical KV binding for permanent report links
  return env.KV_TRANSCRIPT || null;
}

// TTL removed intentionally — report links are permanent unless manually deleted from KV
function getReportLinkTtlSeconds(env) {
  return null;
}

function randomShortId(bytes = 18) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return b64UrlEncode(arr);
}

function getShortReportKey(reportId) {
  return `report:${String(reportId || "").trim()}`;
}

function getReportUnlockKey(eventId) {
  return `report-unlock:${String(eventId || "").trim()}`;
}

function extractStoredReportPayload(reportUrl) {
  const url = new URL(String(reportUrl || "").trim());

  if (url.searchParams.get("r")) {
    return { ok: false, error: "reportUrl_already_short" };
  }

  const hash = url.hash ? url.hash.slice(1).trim() : "";
  if (hash) {
    return { ok: true, payload: hash, transport: "hash" };
  }

  const qp = url.searchParams.get("data") || url.searchParams.get("payload") || "";
  if (qp.trim()) {
    return { ok: true, payload: qp.trim(), transport: "query" };
  }

  return { ok: false, error: "missing_report_payload" };
}

async function storeShortReportPayload(env, payload, meta = {}) {
  const kv = getReportKv(env);
  if (!kv) throw new Error("Missing KV binding: KV_TRANSCRIPT");

  const now = new Date().toISOString();

  for (let i = 0; i < 5; i++) {
    const reportId = randomShortId();
    const key = getShortReportKey(reportId);

    const existing = await kv.get(key);
    if (existing) continue;

    await kv.put(
      key,
      JSON.stringify(
        {
          createdAt: now,
          payload: String(payload || ""),
          payloadTransport: meta.payloadTransport || "hash",
          sourcePath: meta.sourcePath || "/assets/report.html"
        },
        null,
        2
      )
    );

    return {
      reportId,
      shortUrl: buildShortReportUrl(reportId)
    };
  }

  throw new Error("Failed to allocate a unique reportId");
}

function buildShortReportUrl(reportId) {
  return `https://transcript.taxmonitor.pro/assets/report?r=${encodeURIComponent(reportId)}`;
}

async function resolveShortReportPayload(env, reportId) {
  const kv = getReportKv(env);
  if (!kv) throw new Error("Missing KV binding: KV_TRANSCRIPT");

  const raw = await kv.get(getShortReportKey(reportId));
  if (!raw) return null;

  const parsed = tryParseJson(raw);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== "object") return null;

  return parsed.value;
}

function pemToArrayBuffer(pem) {
  const clean = String(pem || "")
    .replace(/-----BEGIN[\s\S]*?-----/g, "")
    .replace(/-----END[\s\S]*?-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function b64UrlEncode(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function googleServiceAccountAccessToken(env, subjectUser, scopes) {
  const now = Math.floor(Date.now() / 1000);
  const iat = now - 5;
  const exp = now + 55 * 60;

  const tokenUri = env.GOOGLE_TOKEN_URI;
  const clientEmail = env.GOOGLE_CLIENT_EMAIL;
  const privateKeyPem = env.GOOGLE_PRIVATE_KEY;

  if (!tokenUri || !clientEmail || !privateKeyPem) {
    throw new Error("Missing Google env vars: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_TOKEN_URI.");
  }
  if (!subjectUser) {
    throw new Error("Missing Workspace user env var: GOOGLE_WORKSPACE_USER_*.");
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    aud: tokenUri,
    exp,
    iat,
    iss: clientEmail,
    scope: (Array.isArray(scopes) ? scopes : [String(scopes)]).join(" "),
    sub: subjectUser,
  };

  const enc = (obj) => b64UrlEncode(new TextEncoder().encode(JSON.stringify(obj)));
  const signingInput = enc(header) + "." + enc(claim);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput)
  );

  const jwt = signingInput + "." + b64UrlEncode(new Uint8Array(sig));

  const body = new URLSearchParams();
  body.set("assertion", jwt);
  body.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("Google token exchange failed (" + String(res.status) + "): " + (t || res.statusText));
  }

  const parsed = await res.json();
  const accessToken = parsed && parsed.access_token ? String(parsed.access_token) : "";
  if (!accessToken) throw new Error("Google token exchange returned no access_token.");
  return accessToken;
}

function makeRfc2822({ from, to, subject, text }) {
  const safeSubject = String(subject || "").replace(/[\r\n]+/g, " ").trim();
  const safeFrom = String(from || "").replace(/[\r\n]+/g, "").trim();
  const safeTo = String(to || "").replace(/[\r\n]+/g, "").trim();
  const safeText = String(text || "").replace(/\r\n/g, "\n");

  return [
    "From: " + safeFrom,
    "To: " + safeTo,
    "Subject: " + safeSubject,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    safeText,
    "",
  ].join("\n");
}

async function gmailSendMessage(env, { from, to, subject, text }) {
  const workspaceUser =
    env.GOOGLE_WORKSPACE_USER_SUPPORT ||
    env.GOOGLE_WORKSPACE_USER_NOREPLY ||
    env.GOOGLE_WORKSPACE_USER_DEFAULT;

  const token = await googleServiceAccountAccessToken(env, workspaceUser, [
    "https://www.googleapis.com/auth/gmail.send",
  ]);

  const rfc = makeRfc2822({ from, to, subject, text });
  const raw = b64UrlEncode(new TextEncoder().encode(rfc));

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("Gmail send failed (" + String(res.status) + "): " + (t || res.statusText));
  }

  return await res.json().catch(() => ({}));
}

function assertEnv(env, keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);
}

function envMissing(env, keys) {
  return keys.filter((k) => !env[k]);
}

function jsonError(request, status, error, details = null) {
  const payload = { error };
  if (details) payload.details = details;

  const pathname = new URL(request.url).pathname;
  const isTranscriptRequest =
    pathname.startsWith("/transcript/") || pathname === "/forms/transcript/report-email";

  return json(payload, status, isTranscriptRequest ? withCors(request) : undefined);
}

/* ------------------------------------------
 * Transcript: Return origin allowlist (strict)
 * ------------------------------------------ */

function normalizeOrigin(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

function getAllowedReturnOrigins(env) {
  const fallback = ["https://transcript.taxmonitor.pro"];

  const raw = String(env.TRANSCRIPT_RETURN_ORIGINS_JSON || "").trim();
  if (!raw) return new Set(fallback);

  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set(fallback);

    const normalized = arr.map(normalizeOrigin).filter(Boolean);
    return new Set(normalized.length ? normalized : fallback);
  } catch {
    return new Set(fallback);
  }
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
      data[k] = typeof v === "string" ? v : v?.name || "uploaded_file";
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
 * Ids
 * ------------------------------------------ */

function isUuidLike(v) {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim())
  );
}

/* ------------------------------------------
 * Transcript: Stripe helpers
 * ------------------------------------------ */

async function stripeFetch(env, method, path, bodyObj = null, extraHeaders = {}) {
  assertEnv(env, ["STRIPE_SECRET_KEY"]);
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
      ...extraHeaders,
    },
    body: bodyObj ? new URLSearchParams(bodyObj).toString() : null,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) throw new Error(`Stripe error (${res.status}): ${data?.error?.message || text}`);
  return data;
}

async function verifyStripeSignature(env, sigHeader, rawBodyText) {
  const parts = sigHeader.split(",").map((p) => p.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Part = parts.find((p) => p.startsWith("v1="));

  if (!tPart || !v1Part) throw new Error("Invalid Stripe signature header");

  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);

  const signedPayload = `${timestamp}.${rawBodyText}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (!timingSafeEqualHex(expected, signature)) throw new Error("Stripe signature verification failed");
  return JSON.parse(rawBodyText);
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/* ------------------------------------------
 * Transcript: Durable Object authoritative ledger
 * ------------------------------------------ */

export class TokenLedger {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/balance") {
      const balance = (await this.state.storage.get("balance")) ?? 0;
      return json({ balance }, 200);
    }

    if (request.method === "POST" && url.pathname === "/credit") {
      const body = await request.json().catch(() => ({}));
      const amount = Number(body?.amount ?? 0);
      const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";

      if (!Number.isFinite(amount) || amount <= 0) return json({ error: "invalid_amount" }, 400);
      if (!requestId) return json({ error: "missing_requestId" }, 400);

      const idemKey = `credit:${requestId}`;
      const already = await this.state.storage.get(idemKey);
      if (already !== undefined) return json({ balance: already, idempotent: true }, 200);

      const current = (await this.state.storage.get("balance")) ?? 0;
      const next = Number(current) + amount;

      await this.state.storage.put("balance", next);
      await this.state.storage.put(idemKey, next);

      return json({ balance: next }, 200);
    }

    if (request.method === "POST" && url.pathname === "/consume") {
      const body = await request.json().catch(() => ({}));
      const amount = Number(body?.amount ?? 1);
      const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";

      if (!Number.isFinite(amount) || amount <= 0) return json({ error: "invalid_amount" }, 400);
      if (!requestId) return json({ error: "missing_requestId" }, 400);

      const idemKey = `consume:${requestId}`;
      const already = await this.state.storage.get(idemKey);
      if (already !== undefined) return json({ balance: already, idempotent: true }, 200);

      const current = (await this.state.storage.get("balance")) ?? 0;
      if (Number(current) < amount) return json({ balance: current, error: "insufficient_balance", needed: amount }, 402);

      const next = Number(current) - amount;
      await this.state.storage.put("balance", next);
      await this.state.storage.put(idemKey, next);

      return json({ balance: next }, 200);
    }

    return json({ error: "not_found" }, 404);
  }
}

function getLedgerStub(env, tokenId) {
  if (!env.TOKEN_LEDGER) throw new Error("Missing Durable Object binding: TOKEN_LEDGER");
  const id = env.TOKEN_LEDGER.idFromName(tokenId);
  return env.TOKEN_LEDGER.get(id);
}

/* ------------------------------------------
 * Transcript: Handlers
 * ------------------------------------------ */

async function handleGetTranscriptPrices(request, env) {
  const required = ["CREDIT_MAP_JSON", "PRICE_10", "PRICE_100", "PRICE_25", "STRIPE_SECRET_KEY"];
  const missing = envMissing(env, required);
  if (missing.length) return jsonError(request, 503, "pricing_temporarily_unavailable", { missing: missing.sort() });

  let creditMap;
  try {
    creditMap = JSON.parse(env.CREDIT_MAP_JSON);
  } catch (err) {
    return jsonError(request, 500, "invalid_credit_map", String(err?.message || err));
  }

  const priceIds = [env.PRICE_10, env.PRICE_25, env.PRICE_100].filter(Boolean).sort();

  try {
    const out = [];
    for (const priceId of priceIds) {
      const price = await stripeFetch(env, "GET", `/prices/${encodeURIComponent(priceId)}`);
      const credits = creditMap[priceId] ?? null;

      out.push({
        amount: price.unit_amount,
        credits,
        currency: (price.currency || "usd").toUpperCase(),
        label: "Transcript.Tax Monitor Pro",
        perks: ["Client-ready report preview", "Credits applied instantly", "Local PDF parsing (no uploads)"].sort(),
        priceId,
        recommended: credits === 25,
      });
    }

    out.sort((a, b) => (a.credits || 0) - (b.credits || 0));
    return json({ prices: out }, 200, withCors(request));
  } catch (err) {
    return jsonError(request, 502, "pricing_temporarily_unavailable", String(err?.message || err));
  }
}

async function handleCreateTranscriptCheckout(request, env) {
  const required = ["CREDIT_MAP_JSON", "PRICE_10", "PRICE_100", "PRICE_25", "STRIPE_SECRET_KEY"];
  const missing = envMissing(env, required);
  if (missing.length) return jsonError(request, 503, "checkout_temporarily_unavailable", { missing: missing.sort() });

  const body = await request.json().catch(() => ({}));
  const priceId = typeof body?.priceId === "string" ? body.priceId.trim() : "";
  const tokenId = typeof body?.tokenId === "string" ? body.tokenId.trim() : "";
  const returnUrlBaseRaw = typeof body?.returnUrlBase === "string" ? body.returnUrlBase.trim() : "";
  const successPathRaw = typeof body?.successPath === "string" ? body.successPath.trim() : "";

  if (!priceId) return jsonError(request, 400, "missing_priceId");
  if (!tokenId) return jsonError(request, 400, "missing_tokenId");

  const allowedPrices = [env.PRICE_10, env.PRICE_25, env.PRICE_100].filter(Boolean);
  if (!allowedPrices.includes(priceId)) return jsonError(request, 400, "invalid_priceId");

  const allowedReturnOrigins = getAllowedReturnOrigins(env);
  const returnOrigin = normalizeOrigin(returnUrlBaseRaw);

  if (!returnOrigin) return jsonError(request, 400, "missing_or_invalid_returnUrlBase");

  if (!allowedReturnOrigins.has(returnOrigin)) {
    return jsonError(request, 400, "return_origin_not_allowed", {
      allowed: Array.from(allowedReturnOrigins).sort(),
      returnOrigin,
    });
  }

  const successPath = successPathRaw === "/payment-confirmation" ? "/payment-confirmation" : "/payment-confirmation";

  try {
    const session = await stripeFetch(env, "POST", "/checkout/sessions", {
      mode: "payment",
      allow_promotion_codes: "true",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      cancel_url: `${returnOrigin}/index.html#pricing`,
      success_url: `${returnOrigin}${successPath}?session_id={CHECKOUT_SESSION_ID}&tokenId=${encodeURIComponent(tokenId)}`,
      "metadata[priceId]": priceId,
      "metadata[tokenId]": tokenId,
    });

    return json({ id: session.id, url: session.url }, 200, withCors(request));
  } catch (err) {
    return jsonError(request, 502, "checkout_temporarily_unavailable", String(err?.message || err));
  }
}

async function handleGetTranscriptTokens(request, url, env) {
  const tokenId = (url.searchParams.get("tokenId") || "").trim();
  if (!tokenId) return json({ error: "missing_tokenId" }, 400, withCors(request));

  const stub = getLedgerStub(env, tokenId);
  const res = await stub.fetch("https://ledger/balance", { method: "GET" });
  const out = await res.json().catch(() => ({}));

  return json({ balance: out.balance ?? 0, tokenId }, 200, withCors(request));
}

async function handleConsumeTranscriptTokens(request, env, ctx) {
  const body = await request.json().catch(() => ({}));
  const tokenId = typeof body?.tokenId === "string" ? body.tokenId.trim() : "";
  const amount = Number(body?.amount ?? 1);

  if (!tokenId) return json({ error: "missing_tokenId" }, 400, withCors(request));
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: "invalid_amount" }, 400, withCors(request));

  const requestIdRaw = typeof body?.requestId === "string" ? body.requestId.trim() : "";
  const requestId = isUuidLike(requestIdRaw) ? requestIdRaw : crypto.randomUUID();
  const stub = getLedgerStub(env, tokenId);

  const res = await stub.fetch("https://ledger/consume", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount, requestId }),
  });

  const out = await res.json().catch(() => ({}));

  if (res.ok) {
    const kv = getReportKv(env);
    if (kv) {
      ctx.waitUntil(
        kv.put(
          getReportUnlockKey(requestId),
          JSON.stringify(
            {
              amount,
              balanceAfter: out.balance ?? null,
              createdAt: new Date().toISOString(),
              tokenId,
              type: "preview_unlock",
            },
            null,
            2
          )
        )
      );
    }
  }

  if (env.R2_TRANSCRIPT) {
    const key = `receipts/consume/${requestId}.json`;
    ctx.waitUntil(
      env.R2_TRANSCRIPT.put(
        key,
        JSON.stringify({ amount, at: new Date().toISOString(), balance: out.balance, tokenId }, null, 2),
        { httpMetadata: { contentType: "application/json" } }
      )
    );
  }

  return json({ ...out, requestId, tokenId }, res.status, withCors(request));
}

async function handleTranscriptStripeWebhook(request, env, ctx) {
  assertEnv(env, ["CREDIT_MAP_JSON", "STRIPE_WEBHOOK_SECRET"]);

  const sig = request.headers.get("stripe-signature");
  if (!sig) return json({ error: "missing_signature" }, 400);

  const rawBody = await request.arrayBuffer();
  const rawText = new TextDecoder().decode(rawBody);
  const event = await verifyStripeSignature(env, sig, rawText);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const tokenId = session?.metadata?.tokenId;
    const priceId = session?.metadata?.priceId;

    if (tokenId && priceId) {
      const creditMap = JSON.parse(env.CREDIT_MAP_JSON);
      const credits = creditMap[priceId];

      if (typeof credits === "number" && credits > 0) {
        const requestId = `stripe:${session.id}`;
        const stub = getLedgerStub(env, tokenId);

        await stub.fetch("https://ledger/credit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ amount: credits, requestId }),
        });

        if (env.R2_TRANSCRIPT) {
          const key = `receipts/stripe/${session.id}.json`;
          ctx.waitUntil(
            env.R2_TRANSCRIPT.put(
              key,
              JSON.stringify(
                {
                  at: new Date().toISOString(),
                  credits,
                  priceId,
                  sessionId: session.id,
                  tokenId,
                  type: event.type,
                },
                null,
                2
              ),
              { httpMetadata: { contentType: "application/json" } }
            )
          );
        }
      }
    }
  }

  return json({ received: true }, 200);
}

/* ------------------------------------------
 * FORMS: Transcript Report Email
 * ------------------------------------------ */

async function handleShortReportLookup(request, env, url) {
  if (!requireMethod(request, ["GET"])) {
    return new Response("Method not allowed", { status: 405 });
  }

  const reportId = String(url.searchParams.get("r") || "").trim();
  if (!reportId || !/^[A-Za-z0-9_-]{8,128}$/.test(reportId)) {
    return new Response("Invalid report link.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const stored = await resolveShortReportPayload(env, reportId);
  if (!stored || !stored.payload) {
    return new Response("This report link was not found.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const target = new URL("https://transcript.taxmonitor.pro/assets/report.html");
  if (String(stored.payloadTransport || "hash") === "query") {
    target.searchParams.set("data", String(stored.payload));
  } else {
    target.hash = String(stored.payload);
  }

  return Response.redirect(target.toString(), 302);
}

async function handleFormsTranscriptReportEmail(request, env, ctx) {
  if (!requireMethod(request, ["POST"])) {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const parsed = await parseInboundBody(request);
  if (!parsed.ok) {
    return new Response(JSON.stringify({ ok: false, error: parsed.error, details: parsed.details }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const email = String(parsed.data?.email || "").trim();
  const eventId = String(parsed.data?.eventId || "").trim();
  const reportUrl = String(parsed.data?.reportUrl || "").trim();
  const tokenId = String(parsed.data?.tokenId || "").trim();

  const missing = [];
  if (!email) missing.push("email");
  if (!eventId) missing.push("eventId");
  if (!reportUrl) missing.push("reportUrl");
  if (!tokenId) missing.push("tokenId");

  if (missing.length) {
    return new Response(JSON.stringify({ ok: false, error: "Missing required fields", missing }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  if (!isLikelyEmail(email)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  if (!isTokenIdFormat(tokenId)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid tokenId format" }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  if (!isUuidLike(eventId)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid eventId format" }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  if (!isSafeReportUrl(reportUrl)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid reportUrl" }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const kv = getReportKv(env);
  if (!kv) {
    return new Response(JSON.stringify({ ok: false, error: "Missing KV binding: KV_TRANSCRIPT" }), {
      status: 500,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const unlockRaw = await kv.get(getReportUnlockKey(eventId));
  if (!unlockRaw) {
    return new Response(JSON.stringify({ ok: false, error: "report_not_unlocked" }), {
      status: 403,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const unlockParsed = tryParseJson(unlockRaw);
  const unlock = unlockParsed.ok ? unlockParsed.value : null;
  if (!unlock || String(unlock.tokenId || "") !== tokenId) {
    return new Response(JSON.stringify({ ok: false, error: "report_unlock_token_mismatch" }), {
      status: 403,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const stub = getLedgerStub(env, tokenId);
  const balanceRes = await stub.fetch("https://ledger/balance", { method: "GET" });
  const balanceOut = await balanceRes.json().catch(() => ({}));

  const extracted = extractStoredReportPayload(reportUrl);
  if (!extracted.ok) {
    return new Response(JSON.stringify({ ok: false, error: extracted.error }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const shortLink = await storeShortReportPayload(env, extracted.payload, {
    payloadTransport: extracted.transport,
    sourcePath: "/assets/report.html",
  });

  const fromUser =
    env.GOOGLE_WORKSPACE_USER_SUPPORT ||
    env.GOOGLE_WORKSPACE_USER_NOREPLY ||
    env.GOOGLE_WORKSPACE_USER_DEFAULT;

  const from = "Transcript Tax Monitor Pro <" + String(fromUser || "support@taxmonitor.pro") + ">";
  const subject = "Your Transcript Tax Report";
  const text = `Your transcript report is ready.

Open report:
${shortLink.shortUrl}

Important:
- Save this email if you may need the report again.
- This link is intended for your use only.
- This report link does not expire unless you remove it from KV.

If you did not request this report, you can ignore this email.

Transcript Tax Monitor Pro`;

  await gmailSendMessage(env, { from, to: email, subject, text });

  if (env.R2_TRANSCRIPT) {
    const key = `receipts/report-email/${shortLink.reportId}.json`;
    ctx.waitUntil(
      env.R2_TRANSCRIPT.put(
        key,
        JSON.stringify(
          {
            at: new Date().toISOString(),
            email,
            eventId,
            remainingBalance: balanceOut?.balance ?? null,
            reportId: shortLink.reportId,
            shortUrl: shortLink.shortUrl,
            tokenId,
          },
          null,
          2
        ),
        { httpMetadata: { contentType: "application/json" } }
      )
    );
  }

  return new Response(JSON.stringify({ ok: true, reportId: shortLink.reportId, reportUrl: shortLink.shortUrl, remainingBalance: balanceOut?.balance ?? null }), {
    status: 200,
    headers: {
      ...corsHeadersForRequest(request),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function handleGetTranscriptReportLink(request, url, env) {
  const reportId = (url.searchParams.get("reportId") || url.searchParams.get("r") || "").trim();
  if (!reportId) return json({ ok: false, error: "missing_reportId" }, 400, withCors(request));

  const link = await getShortReportLink(env, reportId);
  if (!link) return json({ ok: false, error: "report_not_found" }, 404, withCors(request));

  return json({ ok: true, reportId: link.reportId, reportUrl: link.reportUrl }, 200, withCors(request));
}

async function handleAssetReportRedirect(request, url, env) {
  const reportId = (url.searchParams.get("r") || "").trim();
  if (!reportId) return null;

  return await handleShortReportLookup(request, env, url);
}

/* ------------------------------------------
 * Worker Entry
 * ------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/transcript/")) {
      const pre = handleCorsPreflight(request);
      if (pre) return pre;

      try {
        if (request.method === "GET" && isPath(url, "/transcript/prices")) {
          return await handleGetTranscriptPrices(request, env);
        }

        if (request.method === "POST" && isPath(url, "/transcript/checkout")) {
          return await handleCreateTranscriptCheckout(request, env);
        }

        if (request.method === "GET" && isPath(url, "/transcript/tokens")) {
          return await handleGetTranscriptTokens(request, url, env);
        }

        if (request.method === "POST" && isPath(url, "/transcript/consume")) {
          return await handleConsumeTranscriptTokens(request, env, ctx);
        }

        if (request.method === "POST" && isPath(url, "/transcript/stripe/webhook")) {
          return await handleTranscriptStripeWebhook(request, env, ctx);
        }

        return jsonError(request, 404, "not_found");
      } catch (err) {
        return jsonError(request, 500, "internal_error", String(err?.message || err));
      }
    }

    if (request.method === "GET" && isPath(url, "/transcript/report-link")) {
      try {
        return await handleGetTranscriptReportLink(request, url, env);
      } catch (err) {
        return jsonError(request, 500, "internal_error", String(err?.message || err));
      }
    }

    if (request.method === "GET" && (isPath(url, "/assets/report") || isPath(url, "/assets/report.html"))) {
      try {
        const redirectRes = await handleAssetReportRedirect(request, url, env);
        if (redirectRes) return redirectRes;
      } catch (err) {
        return new Response("Unable to open this report link.", {
          status: 500,
          headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
        });
      }
    }

    if (request.method === "GET" && isPath(url, "/health")) {
      return jsonResponse({ ok: true, service: "transcript-tax-monitor-pro-api" }, { status: 200 });
    }

    if (request.method === "OPTIONS" && isPath(url, "/forms/transcript/report-email")) {
      return new Response("", { status: 204, headers: corsHeadersForRequest(request) });
    }

    if (isPath(url, "/forms/transcript/report-email")) {
      try {
        return await handleFormsTranscriptReportEmail(request, env, ctx);
      } catch (err) {
        return new Response(
          JSON.stringify({ ok: false, error: "internal_error", details: String(err?.message || err) }),
          {
            status: 500,
            headers: {
              ...corsHeadersForRequest(request),
              "Content-Type": "application/json; charset=utf-8",
            },
          }
        );
      }
    }

    return jsonResponse({ ok: false, error: "Not found" }, { status: 404 });
  },
};
