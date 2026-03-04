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
 * Transcript routes:
 * - GET  /transcript/prices
 * - POST /transcript/checkout
 * - GET  /transcript/tokens?tokenId=...
 * - POST /transcript/consume
 * - POST /transcript/stripe/webhook
 *
 * Implemented:
 * - Receipts ledger (append-only): receipts/form/{eventId}.json, receipts/stripe/{eventId}.json, receipts/cal/{eventId}.json
 * - Canonical objects: accounts/{accountId}.json, orders/{orderId}.json, support/{supportId}.json
 * - ClickUp projection after R2 write
 *
 * NOTE:
 * This file is large. Keep edits minimal and contract-safe.
 */

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

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

  const out = {
    "access-control-allow-headers": "content-type, stripe-signature",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-origin": allowed.has(origin) ? origin : "https://transcript.taxmonitor.pro",
    "access-control-max-age": "86400",
    ...headers,
  };

  return out;
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
  const allowed = [
    "https://transcript.taxmonitor.pro",
  ];

  if (!origin) return {};
  const ok = allowed.includes(origin);

  return {
    "Access-Control-Allow-Credentials": "false",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Origin": ok ? origin : "null",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
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
  if (s.length > 12000) return false;
  return s.startsWith("https://transcript.taxmonitor.pro/assets/report-preview.html#");
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

  const json = await res.json();
  const accessToken = json && json.access_token ? String(json.access_token) : "";
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
      "Authorization": "Bearer " + token,
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

  const isTranscript = new URL(request.url).pathname.startsWith("/transcript/");
  return json(payload, status, isTranscript ? withCors(request) : undefined);
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
 * Intake/Order/Support Normalization
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

function normalizeOrderPayload(input) {
  const get = (key) => {
    const v = input?.[key];
    return typeof v === "string" ? v.trim() : "";
  };

  const normalized = {
    notes: get("Notes") || get("notes"),
    orderToken: get("CF_Order Token") || get("Order Token") || get("orderToken"),
    orderType: get("Order Type") || get("orderType"),
    primaryEmail: get("CRM Primary Email") || get("Email") || get("email"),
    productName: get("Product Name") || get("Plan") || get("productName"),
  };

  const missing = [];
  if (!normalized.primaryEmail) missing.push("CRM Primary Email");
  if (!normalized.productName && !normalized.orderType) missing.push("Product Name");

  return { missing, normalized };
}

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
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim())
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
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
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
    return { ok: false, error: "Daily submission limit reached for this email.", retryAfterSeconds: 86400 };
  }

  if (secondsSinceLast < cooldownSeconds) {
    return { ok: false, error: "Please wait before submitting again.", retryAfterSeconds: cooldownSeconds - secondsSinceLast };
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

  if (!res.ok) throw new Error(`ClickUp ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function addClickUpComment(env, taskId, commentText) {
  if (!taskId) return;

  await clickUpRequest(env, `/task/${taskId}/comment`, {
    method: "POST",
    body: JSON.stringify({ comment_text: commentText, notify_all: false }),
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
    "",
    "R2 Keys:",
    `- accounts/${account.accountId}.json`,
    `- receipts/form/${receipt.eventId}.json`,
    "",
    "Submitted:",
    `- Estimated Balance Due Range: ${account.metadata?.estimatedBalanceDueRange || "—"}`,
    `- IRS Notice Date: ${account.metadata?.irsNoticeDate || "—"}`,
    `- IRS Notice Received: ${account.metadata?.irsNoticeReceived || "—"}`,
    `- IRS Notice Type: ${account.metadata?.irsNoticeType || "—"}`,
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
    clickUp: { ...(account.clickUp || {}), accountTaskId: createdId },
  };

  await writeJsonR2(env, accountKey, patched);
  return createdId;
}

async function createClickUpOrderTask(env, account, order, receipt) {
  if (!env.CLICKUP_ORDERS_LIST_ID) throw new Error("Missing CLICKUP_ORDERS_LIST_ID");

  const name = (`Order — ${account.firstName || ""} ${account.lastName || ""}`.trim() || `Order — ${account.accountId}`);

  const description = [
    `Account: ${account.firstName || ""} ${account.lastName || ""}`.trim(),
    `Account ID: ${account.accountId}`,
    `Email: ${account.primaryEmail || "—"}`,
    `Order ID: ${order.orderId}`,
    `Product/Plan: ${order.productName || "—"}`,
    `Type: ${order.orderType || "—"}`,
    `Received: ${receipt.timestamp}`,
    `Trigger: ${receipt.source}:${receipt.type}`,
    "",
    "R2 Keys:",
    `- accounts/${account.accountId}.json`,
    `- orders/${order.orderId}.json`,
    `- receipts/form/${receipt.eventId}.json`,
    "",
    `Notes: ${order.notes || "—"}`,
  ].join("\n");

  const payload = { description, name, status: "New" };

  const created = await clickUpRequest(env, `/list/${env.CLICKUP_ORDERS_LIST_ID}/task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return created?.id || null;
}

async function createClickUpSupportTask(env, account, support, receipt) {
  if (!env.CLICKUP_SUPPORT_LIST_ID) throw new Error("Missing CLICKUP_SUPPORT_LIST_ID");

  const name = (`Support — ${account.firstName || ""} ${account.lastName || ""}`.trim() || `Support — ${account.accountId}`);

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
    "",
    "R2 Keys:",
    `- accounts/${account.accountId}.json`,
    `- receipts/form/${receipt.eventId}.json`,
    `- support/${support.supportId}.json`,
    "",
    "Summary:",
    `${support.summary || "—"}`,
  ].join("\n");

  const payload = { description, name, status: "Open" };

  const created = await clickUpRequest(env, `/list/${env.CLICKUP_SUPPORT_LIST_ID}/task`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return created?.id || null;
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
    return jsonError(request, 400, "return_origin_not_allowed", { allowed: Array.from(allowedReturnOrigins).sort(), returnOrigin });
  }

  const successPath = successPathRaw === "/payment-confirmation" ? "/payment-confirmation" : "/payment-confirmation";

  try {
    const session = await stripeFetch(env, "POST", "/checkout/sessions", {
      mode: "payment",
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

  return json({ ...out, tokenId }, res.status, withCors(request));
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
                { at: new Date().toISOString(), credits, priceId, sessionId: session.id, tokenId, type: event.type },
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

    if (request.method === "GET" && isPath(url, "/health")) {
      return jsonResponse({ ok: true, service: "taxmonitor-pro-api" }, { status: 200 });
    }

    if (request.method === "OPTIONS" && isPath(url, "/forms/transcript/report-email")) {
      return new Response("", { status: 204, headers: corsHeadersForRequest(request) });
    }

    if (isPath(url, "/forms/transcript/report-email")) return await handleFormsTranscriptReportEmail(request, env, ctx);

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
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds || 60) } }
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
      clickUp: { ...(existingAccount?.clickUp || {}) },
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
    if (!existingAccount) throw new Error("Account not found for email. Submit intake first or create account before order.");

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
        await setClickUpTaskCustomField(env, accountTaskId, CU_ACCOUNTS_CF.accountOrderTaskLink, [orderTaskId]);
      }
    }

    receipt.processed = true;
    receipt.processingError = null;
    receipt.clickUpTaskId = orderTaskId;

    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      { ok: true, accountId, eventId, orderId, orderTaskId, message: "Order processed: receipt + canonical + ClickUp.", receivedAs: parsed.type },
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
    if (!existingAccount) throw new Error("Account not found for email. Submit intake first or create account before support.");

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
        await setClickUpTaskCustomField(env, accountTaskId, CU_ACCOUNTS_CF.accountSupportTaskLink, [supportTaskId]);
      }
    }

    receipt.processed = true;
    receipt.processingError = null;
    receipt.clickUpTaskId = supportTaskId;

    await writeJsonR2(env, receiptKey, receipt);

    return jsonResponse(
      { ok: true, accountId, eventId, supportId, supportTaskId, message: "Support processed: receipt + canonical + ClickUp.", receivedAs: parsed.type },
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
 * FORMS: Transcript Report Email
 * ------------------------------------------ */

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
  const reportId = String(parsed.data?.reportId || "").trim();
  const reportUrl = String(parsed.data?.reportUrl || "").trim();
  const tokenId = String(parsed.data?.tokenId || "").trim();

  const missing = [];
  if (!email) missing.push("email");
  if (!eventId) missing.push("eventId");
  if (!reportId) missing.push("reportId");
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

  if (!isSafeReportUrl(reportUrl)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid reportUrl" }), {
      status: 400,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  // Enforce 1-credit consumption for report-email (idempotent by eventId)
  const stub = getLedgerStub(env, tokenId);
  const consumeRes = await stub.fetch("https://ledger/consume", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: 1, requestId: eventId }),
  });

  const consumeOut = await consumeRes.json().catch(() => ({}));
  if (!consumeRes.ok) {
    return new Response(JSON.stringify({ ok: false, error: consumeOut?.error || "insufficient_balance", details: consumeOut }), {
      status: consumeRes.status || 402,
      headers: { ...corsHeadersForRequest(request), "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const fromUser =
    env.GOOGLE_WORKSPACE_USER_SUPPORT ||
    env.GOOGLE_WORKSPACE_USER_NOREPLY ||
    env.GOOGLE_WORKSPACE_USER_DEFAULT;

  const from = "Transcript Tax Monitor Pro <" + String(fromUser || "support@taxmonitor.pro") + ">";
  const subject = "Your Transcript Report Link";
  const text = `Here’s your report link:

${reportUrl}

Tip: Save this email. The link contains the report data (nothing is uploaded).
`;

  await gmailSendMessage(env, { from, to: email, subject, text });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      ...corsHeadersForRequest(request),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

/* ------------------------------------------
 * STRIPE (legacy stub)
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

