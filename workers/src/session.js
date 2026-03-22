/* ------------------------------------------
 * Session Utilities — Tax Monitor Pro
 * ------------------------------------------
 * Implements tmp_session HttpOnly cookie creation, validation, and destruction.
 *
 * Token format: base64url(JSON.stringify(payload)) + "." + base64url(HMAC-SHA256)
 * Cookie:       HttpOnly; Secure; SameSite=Lax; Domain=.taxmonitor.pro; Path=/
 * Signed with:  SESSION_SECRET (env var — never committed)
 * TTL:          SESSION_TTL_SECONDS (default 86400)
 *
 * Exported functions (5):
 *   createSessionToken(env, payload)   → signed token string
 *   verifySessionToken(env, token)     → payload | null
 *   setSessionCookie(env, res, payload)→ Response with Set-Cookie
 *   clearSessionCookie(env, res)       → Response with expired Set-Cookie
 *   getSessionFromRequest(env, request)→ payload | null
 */

/* ------------------------------------------
 * Exported API
 * ------------------------------------------ */

/**
 * Create a signed session token.
 * Appends expiresAt to payload using SESSION_TTL_SECONDS.
 * Returns: base64url(payload) + "." + base64url(HMAC-SHA256)
 */
export async function createSessionToken(env, payload) {
  const ttl = parseInt(env.SESSION_TTL_SECONDS || "86400", 10);
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const fullPayload = { ...payload, expiresAt };

  const payloadB64 = b64uEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const key = await importHmacKey(env.SESSION_SECRET);
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = b64uEncode(sigBytes);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a signed session token.
 * Returns: decoded payload object if valid and not expired, null otherwise.
 */
export async function verifySessionToken(env, token) {
  if (!token || typeof token !== "string") return null;
  if (!env.SESSION_SECRET) return null;

  const dotIdx = token.lastIndexOf(".");
  if (dotIdx < 0) return null;

  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);

  // Recompute expected signature
  const key = await importHmacKey(env.SESSION_SECRET);
  const expectedSigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const expectedSigB64 = b64uEncode(expectedSigBytes);

  // Timing-safe comparison
  if (!timingSafeEqual(sigB64, expectedSigB64)) return null;

  // Decode and parse payload
  let payload;
  try {
    const decoded = new TextDecoder().decode(b64uDecode(payloadB64));
    payload = JSON.parse(decoded);
  } catch {
    return null;
  }

  // Check expiry
  if (!payload.expiresAt || new Date(payload.expiresAt) <= new Date()) return null;

  return payload;
}

/**
 * Set tmp_session cookie on a Response.
 * Creates a new token and appends Set-Cookie header.
 * Returns: new Response with cookie header appended.
 */
export async function setSessionCookie(env, response, payload) {
  const token = await createSessionToken(env, payload);
  const cookieName = env.SESSION_COOKIE_NAME || "tmp_session";
  const domain = env.COOKIE_DOMAIN || ".taxmonitor.pro";
  const ttl = parseInt(env.SESSION_TTL_SECONDS || "86400", 10);

  const cookieValue =
    `${cookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Domain=${domain}; Path=/; Max-Age=${ttl}`;

  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookieValue);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  });
}

/**
 * Clear tmp_session cookie (logout).
 * Returns: new Response with expired Set-Cookie header.
 */
export function clearSessionCookie(env, response) {
  const cookieName = env.SESSION_COOKIE_NAME || "tmp_session";
  const domain = env.COOKIE_DOMAIN || ".taxmonitor.pro";

  const cookieValue =
    `${cookieName}=; HttpOnly; Secure; SameSite=Lax; Domain=${domain}; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookieValue);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  });
}

/**
 * Read and verify session from a Request object.
 * Parses the Cookie header, extracts the session token, and verifies it.
 * Returns: payload object if valid, null if no session or invalid.
 */
export async function getSessionFromRequest(env, request) {
  const cookieName = env.SESSION_COOKIE_NAME || "tmp_session";
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[cookieName];

  if (!token) return null;

  return verifySessionToken(env, token);
}

/* ------------------------------------------
 * Internal Utilities
 * ------------------------------------------ */

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret || "")),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"]
  );
}

function b64uEncode(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64uDecode(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) cookies[name] = value;
  }
  return cookies;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
