/* ------------------------------------------
 * Handlers
 * ------------------------------------------ */

import {
  appendReceipt,
  executeWritePipeline,
  getJson,
  listByField,
  listByPrefix,
  mergeAccountNotificationPreferences,
  putJson
} from "./storage.js";

import {
  clearSessionCookie,
  getSessionFromRequest,
  setSessionCookie
} from "./session.js";

const HANDLERS = {
  getAuthGoogleCallback,
  getAuthGoogleStart,
  getAuthMagicLinkVerify,
  getAuthSession,
  getAuthSsoOidcCallback,
  getAuthSsoOidcStart,
  getAuthSsoSamlStart,
  getAuthTwoFactorStatus,
  getCheckoutStatus,
  getDirectoryProfessional,
  getDirectoryProfessionals,
  getEmailMessage,
  getEmailMessagesByAccount,
  getHealth,
  getInquiry,
  getInquiriesByAccount,
  getNotificationsInApp,
  getNotificationsPreferences,
  getPricing,
  getSupportTicket,
  getSupportTicketsByAccount,
  getTaxpayerAccount,
  getTaxpayerMembership,
  getTaxpayerMembershipsByAccount,
  patchNotificationsPreferences,
  patchSupportTicket,
  patchTaxpayerAccount,
  patchTaxpayerMembership,
  postAuthLogout,
  postAuthMagicLinkRequest,
  postAuthSsoSamlAcs,
  postAuthTwoFactorChallengeVerify,
  postAuthTwoFactorDisable,
  postAuthTwoFactorEnrollInit,
  postAuthTwoFactorEnrollVerify,
  postCheckoutSessions,
  postEmailSend,
  postInquiries,
  postNotificationsInApp,
  postNotificationsSmsSend,
  postSupportTickets,
  postTaxpayerMembershipsFree,
  postWebhooksGoogleEmail,
  postWebhooksStripe,
  postWebhooksTwilio
};

export async function dispatchHandler({ contract, env, request, route, validated }) {
  const handler = HANDLERS[route?.handler];

  if (!handler) {
    throw new Error(`No handler registered for ${route?.handler}`);
  }

  return await handler({
    contract,
    env,
    request,
    route,
    validated
  });
}

/* ------------------------------------------
 * Auth Route Handlers
 * ------------------------------------------ */

async function getAuthSession({ env, request }) {
  const session = await getSessionFromRequest(env, request);

  if (!session) {
    return {
      data: { error: "Unauthorized", ok: false },
      status: 401
    };
  }

  return {
    data: {
      accountId: session.accountId,
      email: session.email,
      expiresAt: session.expiresAt,
      ok: true,
      plan: session.plan,
      role: session.role
    },
    status: 200
  };
}

async function postAuthLogout({ env }) {
  const baseResponse = new Response(
    JSON.stringify({ loggedOut: true, ok: true }),
    { headers: { "content-type": "application/json; charset=utf-8" }, status: 200 }
  );

  // Write audit event (best-effort — does not block logout)
  writeActivityEvent(env, { action: "logout" }).catch(() => {});

  return clearSessionCookie(env, baseResponse);
}

async function getAuthGoogleStart({ env }) {
  const nonce = crypto.randomUUID();

  // Write CSRF nonce to R2 (single-use, verified in callback)
  await putJson(env, `receipts/tmp/auth/oauth-state/${nonce}.json`, {
    createdAt: new Date().toISOString(),
    nonce,
    type: "google"
  });

  const params = new URLSearchParams({
    access_type: "offline",
    client_id: env.GOOGLE_CLIENT_ID || "",
    redirect_uri: env.GOOGLE_REDIRECT_URI || "",
    response_type: "code",
    scope: "openid email profile",
    state: nonce
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return new Response(null, { headers: { Location: url }, status: 302 });
}

async function getAuthGoogleCallback({ env, validated }) {
  const { code, state } = validated.query || {};

  if (!code || !state) {
    return jsonError("missing_params", 400);
  }

  // Verify CSRF state nonce
  const nonceRecord = await getJson(env, `receipts/tmp/auth/oauth-state/${state}.json`);
  if (!nonceRecord) {
    return jsonError("invalid_state", 403);
  }

  // Delete nonce — single-use
  await env.R2_BUCKET.delete(`receipts/tmp/auth/oauth-state/${state}.json`);

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID || "",
      client_secret: env.GOOGLE_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: env.GOOGLE_REDIRECT_URI || ""
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });

  if (!tokenRes.ok) {
    return jsonError("token_exchange_failed", 502);
  }

  const tokens = await tokenRes.json();

  // Fetch user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  if (!userRes.ok) {
    return jsonError("userinfo_failed", 502);
  }

  const userInfo = await userRes.json();
  const { email, name: displayName } = userInfo;

  if (!email) {
    return jsonError("no_email", 400);
  }

  // Upsert account — Google OAuth creates taxpayer accounts, never taxpro
  const account = await upsertAccount(env, { displayName, email, role: "taxpayer" });

  await writeActivityEvent(env, {
    accountId: account.accountId,
    action: "google_oauth_completed",
    actorId: account.accountId
  });

  const redirectResponse = new Response(null, {
    headers: { Location: "https://app.taxmonitor.pro/dashboard" },
    status: 302
  });

  return setSessionCookie(env, redirectResponse, {
    accountId: account.accountId,
    email: account.email,
    plan: account.plan || "free",
    role: account.role
  });
}

async function postAuthMagicLinkRequest({ env, validated }) {
  const email = validated.body?.email;

  if (!email) {
    return { data: { error: "missing_email", ok: false }, status: 400 };
  }

  // Generate raw token and SHA-256 hash
  const rawToken = crypto.randomUUID();
  const tokenHash = await sha256Hex(rawToken);

  const expiryMinutes = parseInt(env.MAGIC_LINK_EXPIRATION_MINUTES || "15", 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  // Write token hash to D1 tmp_magic_link_tokens
  try {
    await env.DB.prepare(
      `INSERT INTO tmp_magic_link_tokens (token_hash, email, expires_at, used, created_at)
       VALUES (?, ?, ?, 0, ?)`
    )
      .bind(tokenHash, email, expiresAt, new Date().toISOString())
      .run();
  } catch (err) {
    console.error("[TMP] magic_link_tokens D1 write failed:", err?.message);
  }

  // Build magic link URL
  const magicLinkUrl = `https://app.taxmonitor.pro/auth/verify?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

  // Write receipt to R2
  const eventId = `EVT_${crypto.randomUUID()}`;
  await putJson(env, `receipts/tmp/auth/magic-link-request/${eventId}.json`, {
    email,
    eventId,
    expiresAt,
    receivedAt: new Date().toISOString()
  });

  // Send email via Gmail API
  const emailResult = await sendMagicLinkEmail(env, { email, magicLinkUrl });

  await writeActivityEvent(env, {
    action: "magic_link_requested",
    actorId: email
  });

  return {
    data: {
      mock: emailResult.mock || false,
      ok: true,
      sent: emailResult.sent !== false
    },
    status: 200
  };
}

async function getAuthMagicLinkVerify({ env, validated }) {
  const { email, token: rawToken } = validated.query || {};

  if (!rawToken || !email) {
    return jsonError("missing_token_or_email", 400);
  }

  const tokenHash = await sha256Hex(rawToken);

  // Look up token in D1
  let tokenRecord = null;
  try {
    tokenRecord = await env.DB.prepare(
      `SELECT token_hash, email, expires_at, used FROM tmp_magic_link_tokens
       WHERE token_hash = ? AND email = ? LIMIT 1`
    )
      .bind(tokenHash, email)
      .first();
  } catch (err) {
    console.error("[TMP] magic_link_tokens D1 read failed:", err?.message);
  }

  // Validate token
  if (
    !tokenRecord ||
    tokenRecord.used === 1 ||
    tokenRecord.used === true ||
    new Date(tokenRecord.expires_at) <= new Date()
  ) {
    return jsonError("invalid_or_expired_link", 400);
  }

  // Mark token used = 1 (never delete — audit trail)
  try {
    await env.DB.prepare(
      `UPDATE tmp_magic_link_tokens SET used = 1 WHERE token_hash = ?`
    )
      .bind(tokenHash)
      .run();
  } catch (err) {
    console.error("[TMP] magic_link used update failed:", err?.message);
  }

  // Upsert account for email
  const account = await upsertAccount(env, { email, role: "taxpayer" });

  await writeActivityEvent(env, {
    accountId: account.accountId,
    action: "magic_link_verified",
    actorId: account.accountId
  });

  const redirectResponse = new Response(null, {
    headers: { Location: "https://app.taxmonitor.pro/dashboard" },
    status: 302
  });

  return setSessionCookie(env, redirectResponse, {
    accountId: account.accountId,
    email: account.email,
    plan: account.plan || "free",
    role: account.role
  });
}

async function getAuthSsoOidcStart({ env }) {
  const nonce = crypto.randomUUID();

  // Generate PKCE code_verifier (64 hex chars — valid range 43-128)
  const codeVerifier =
    crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

  // code_challenge = base64url(SHA-256(code_verifier))
  const challengeBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier)
  );
  const codeChallenge = b64uEncode(challengeBytes);

  // Write nonce + code_verifier to R2
  await putJson(env, `receipts/tmp/auth/oidc-state/${nonce}.json`, {
    codeVerifier,
    createdAt: new Date().toISOString(),
    nonce
  });

  await writeActivityEvent(env, { action: "sso_oidc_started" });

  const issuer = String(env.SSO_OIDC_ISSUER || "").replace(/\/$/, "");

  const params = new URLSearchParams({
    client_id: env.SSO_OIDC_CLIENT_ID || "",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    redirect_uri: env.SSO_OIDC_REDIRECT_URI || "",
    response_type: "code",
    scope: "openid email profile",
    state: nonce
  });

  const url = `${issuer}/auth?${params}`;

  return new Response(null, { headers: { Location: url }, status: 302 });
}

async function getAuthSsoOidcCallback({ env, validated }) {
  const { code, state } = validated.query || {};

  if (!code || !state) {
    return jsonError("missing_params", 400);
  }

  // Verify CSRF state and retrieve code_verifier
  const stateRecord = await getJson(env, `receipts/tmp/auth/oidc-state/${state}.json`);
  if (!stateRecord || stateRecord.nonce !== state) {
    return jsonError("invalid_state", 403);
  }

  // Delete state — single-use
  await env.R2_BUCKET.delete(`receipts/tmp/auth/oidc-state/${state}.json`);

  const codeVerifier = stateRecord.codeVerifier;

  // Fetch OIDC discovery to get token endpoint
  const issuer = String(env.SSO_OIDC_ISSUER || "").replace(/\/$/, "");
  let tokenEndpoint = `${issuer}/token`;
  try {
    const discovery = await fetch(`${issuer}/.well-known/openid-configuration`).then((r) =>
      r.json()
    );
    if (discovery.token_endpoint) tokenEndpoint = discovery.token_endpoint;
  } catch {
    // Use default token endpoint
  }

  // Exchange code for tokens using PKCE
  const tokenRes = await fetch(tokenEndpoint, {
    body: new URLSearchParams({
      client_id: env.SSO_OIDC_CLIENT_ID || "",
      client_secret: env.SSO_OIDC_CLIENT_SECRET || "",
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: env.SSO_OIDC_REDIRECT_URI || ""
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST"
  });

  if (!tokenRes.ok) {
    return jsonError("token_exchange_failed", 502);
  }

  const tokens = await tokenRes.json();
  const idToken = tokens.id_token;

  if (!idToken) {
    return jsonError("no_id_token", 502);
  }

  // Verify ID token signature via JWKS discovery
  let claims;
  try {
    claims = await verifyOidcIdToken(env, idToken);
  } catch (err) {
    console.error("[TMP] OIDC ID token verification failed:", err?.message);
    return jsonError("id_token_verification_failed", 403);
  }

  const email = claims.email;
  const displayName = claims.name;

  if (!email) {
    return jsonError("no_email_in_token", 400);
  }

  // OIDC SSO = enterprise taxpro flow [Q3]
  const account = await upsertAccount(env, { displayName, email, role: "taxpro" });

  await writeActivityEvent(env, {
    accountId: account.accountId,
    action: "sso_oidc_completed",
    actorId: account.accountId
  });

  const redirectResponse = new Response(null, {
    headers: { Location: "https://app.taxmonitor.pro/dashboard" },
    status: 302
  });

  return setSessionCookie(env, redirectResponse, {
    accountId: account.accountId,
    email: account.email,
    plan: account.plan || "free",
    role: account.role
  });
}

async function getAuthSsoSamlStart({ env }) {
  const requestId = `_${crypto.randomUUID().replace(/-/g, "")}`;
  const now = new Date().toISOString();
  const relayState = crypto.randomUUID();

  const acsUrl = env.SSO_SAML_ACS_URL || "https://api.taxmonitor.pro/v1/auth/sso/saml/acs";
  const entityId = env.SSO_SAML_ENTITY_ID || "";
  const idpSsoUrl = env.SSO_SAML_IDP_SSO_URL || "";

  // Generate SAML AuthnRequest XML
  const authnRequest = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<samlp:AuthnRequest`,
    `  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"`,
    `  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"`,
    `  ID="${requestId}"`,
    `  Version="2.0"`,
    `  IssueInstant="${now}"`,
    `  Destination="${idpSsoUrl}"`,
    `  AssertionConsumerServiceURL="${acsUrl}"`,
    `  ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">`,
    `  <saml:Issuer>${entityId}</saml:Issuer>`,
    `  <samlp:NameIDPolicy`,
    `    Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"`,
    `    AllowCreate="true"/>`,
    `</samlp:AuthnRequest>`
  ].join("\n");

  // Deflate using CompressionStream (deflate-raw = raw DEFLATE, required by SAML)
  const compressed = await deflateRaw(new TextEncoder().encode(authnRequest));
  const encodedRequest = encodeURIComponent(b64Encode(compressed));

  // Write RelayState to R2 for CSRF verification in ACS
  await putJson(env, `receipts/tmp/auth/saml-state/${relayState}.json`, {
    createdAt: now,
    relayState,
    requestId
  });

  await writeActivityEvent(env, { action: "saml_started" });

  const redirectUrl = `${idpSsoUrl}?SAMLRequest=${encodedRequest}&RelayState=${encodeURIComponent(relayState)}`;

  return new Response(null, { headers: { Location: redirectUrl }, status: 302 });
}

async function postAuthSsoSamlAcs({ env, validated }) {
  const { RelayState, SAMLResponse } = validated.body || {};

  if (!SAMLResponse || !RelayState) {
    return jsonError("missing_saml_params", 400);
  }

  // Verify RelayState nonce
  const stateRecord = await getJson(env, `receipts/tmp/auth/saml-state/${RelayState}.json`);
  if (!stateRecord) {
    return jsonError("invalid_relay_state", 403);
  }

  // Delete relay state — single-use
  await env.R2_BUCKET.delete(`receipts/tmp/auth/saml-state/${RelayState}.json`);

  // Decode SAML response (base64 → XML string)
  let xmlStr;
  try {
    xmlStr = atob(String(SAMLResponse).replace(/\s+/g, ""));
  } catch {
    return jsonError("invalid_saml_encoding", 400);
  }

  // Verify assertion signature using IdP certificate
  if (env.SSO_SAML_IDP_CERT) {
    const valid = await verifySamlSignature(xmlStr, env.SSO_SAML_IDP_CERT);
    if (!valid) {
      return jsonError("invalid_saml_signature", 403);
    }
  }

  // Check SAML conditions: NotBefore and NotOnOrAfter
  const now = new Date();
  const notBefore = extractXmlAttr(xmlStr, "NotBefore");
  const notOnOrAfter = extractXmlAttr(xmlStr, "NotOnOrAfter");

  if (notBefore && new Date(notBefore) > now) {
    return jsonError("saml_assertion_not_yet_valid", 400);
  }
  if (notOnOrAfter && new Date(notOnOrAfter) <= now) {
    return jsonError("saml_assertion_expired", 400);
  }

  // Extract email from NameID or Attribute
  const email =
    extractXmlContent(xmlStr, "NameID") ||
    extractSamlAttribute(xmlStr, "email") ||
    extractSamlAttribute(xmlStr, "mail") ||
    extractSamlAttribute(xmlStr, "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress");

  if (!email) {
    return jsonError("no_email_in_assertion", 400);
  }

  // Extract display name from common attribute names
  const displayName =
    extractSamlAttribute(xmlStr, "displayName") ||
    extractSamlAttribute(xmlStr, "cn") ||
    extractSamlAttribute(xmlStr, "name") ||
    extractSamlAttribute(xmlStr, "http://schemas.microsoft.com/identity/claims/displayname");

  // SAML = enterprise taxpro flow [Q3, Q7]
  const account = await upsertAccount(env, { displayName, email, role: "taxpro" });

  await writeActivityEvent(env, {
    accountId: account.accountId,
    action: "saml_completed",
    actorId: account.accountId
  });

  const redirectResponse = new Response(null, {
    headers: { Location: "https://app.taxmonitor.pro/dashboard" },
    status: 302
  });

  return setSessionCookie(env, redirectResponse, {
    accountId: account.accountId,
    email: account.email,
    plan: account.plan || "free",
    role: account.role
  });
}

/* ------------------------------------------
 * 2FA Route Handlers (verified — correct R2 paths)
 * ------------------------------------------ */

// R2 path: taxpayer_accounts/{account_id}.json — CORRECT
async function getAuthTwoFactorStatus({ env, validated }) {
  const account = await getJson(env, `taxpayer_accounts/${validated.params.account_id}.json`);

  return {
    data: {
      accountId: validated.params.account_id,
      enabled: Boolean(account?.security?.twoFactor?.enabled),
      ok: true,
      twoFactor: account?.security?.twoFactor || {
        enabled: false
      }
    },
    status: 200
  };
}

// R2 path: taxpayer_accounts/{accountId}.json — CORRECT
async function postAuthTwoFactorEnrollInit({ env, validated }) {
  const accountId = validated.body?.accountId;

  if (!accountId) {
    return {
      data: {
        error: "missing_account_id",
        ok: false
      },
      status: 400
    };
  }

  const enrollmentId = crypto.randomUUID();
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

  const key = `taxpayer_accounts/${accountId}.json`;
  const existing = (await getJson(env, key)) || {
    accountId,
    createdAt: new Date().toISOString()
  };

  const next = {
    ...existing,
    security: {
      ...(existing.security || {}),
      twoFactor: {
        enabled: false,
        pending: {
          enrollmentId,
          verificationCode
        }
      }
    },
    updatedAt: new Date().toISOString()
  };

  await putJson(env, key, next);

  return {
    data: {
      enrollmentId,
      ok: true,
      verificationCode
    },
    status: 200
  };
}

// R2 path: taxpayer_accounts/{accountId}.json — CORRECT
async function postAuthTwoFactorEnrollVerify({ env, validated }) {
  const accountId = validated.body?.accountId;
  const enrollmentId = validated.body?.enrollmentId;
  const verificationCode = validated.body?.verificationCode;

  const key = `taxpayer_accounts/${accountId}.json`;
  const existing = await getJson(env, key);
  const pending = existing?.security?.twoFactor?.pending;

  if (!existing || !pending) {
    return {
      data: {
        error: "pending_enrollment_not_found",
        ok: false
      },
      status: 404
    };
  }

  if (
    String(pending.enrollmentId || "") !== String(enrollmentId || "") ||
    String(pending.verificationCode || "") !== String(verificationCode || "")
  ) {
    return {
      data: {
        error: "verification_failed",
        ok: false
      },
      status: 400
    };
  }

  const next = {
    ...existing,
    security: {
      ...(existing.security || {}),
      twoFactor: {
        enabled: true,
        enrolledAt: new Date().toISOString()
      }
    },
    updatedAt: new Date().toISOString()
  };

  await putJson(env, key, next);

  await writeActivityEvent(env, {
    accountId,
    action: "two_fa_enrolled",
    actorId: accountId
  });

  return {
    data: {
      enabled: true,
      ok: true
    },
    status: 200
  };
}

// R2 path: taxpayer_accounts/{accountId}.json — CORRECT
async function postAuthTwoFactorDisable({ env, validated }) {
  const accountId = validated.body?.accountId;

  if (!accountId) {
    return {
      data: {
        error: "missing_account_id",
        ok: false
      },
      status: 400
    };
  }

  const key = `taxpayer_accounts/${accountId}.json`;
  const existing = (await getJson(env, key)) || {
    accountId,
    createdAt: new Date().toISOString()
  };

  const next = {
    ...existing,
    security: {
      ...(existing.security || {}),
      twoFactor: {
        enabled: false
      }
    },
    updatedAt: new Date().toISOString()
  };

  await putJson(env, key, next);

  await writeActivityEvent(env, {
    accountId,
    action: "two_fa_disabled",
    actorId: accountId
  });

  return {
    data: {
      disabled: true,
      ok: true
    },
    status: 200
  };
}

// Remains stub — Phase 14 (requires TOTP provider library)
async function postAuthTwoFactorChallengeVerify({ env, validated }) {
  const account = await getJson(env, `taxpayer_accounts/${validated.body?.accountId || ""}.json`);

  if (!account?.security?.twoFactor?.enabled) {
    return {
      data: {
        error: "two_factor_not_enabled",
        ok: false
      },
      status: 400
    };
  }

  return notImplemented("2FA challenge verification requires a TOTP provider library (Phase 14).");
}

/* ------------------------------------------
 * Non-Auth Route Handlers (unchanged)
 * ------------------------------------------ */

async function getCheckoutStatus({ env, validated }) {
  const sessionId = validated.query?.session_id;

  if (!sessionId) {
    return {
      data: {
        error: "missing_session_id",
        ok: false
      },
      status: 400
    };
  }

  if (!env.STRIPE_SECRET_KEY) {
    return notImplemented("Stripe secret is not configured for checkout status.");
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`
    },
    method: "GET"
  });

  const payload = await response.json();

  return {
    data: {
      ok: response.ok,
      session: payload
    },
    status: response.ok ? 200 : 502
  };
}

async function getDirectoryProfessional({ env, validated }) {
  const profiles = readDirectoryProfiles(env);
  const professional = profiles.find(
    (item) => String(item.professionalId || item.id || "") === String(validated.params.professional_id || "")
  );

  if (!professional) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      ok: true,
      professional
    },
    status: 200
  };
}

async function getDirectoryProfessionals({ env, validated }) {
  const profiles = readDirectoryProfiles(env);
  const q = String(validated.query?.q || "").trim().toLowerCase();

  const items = q
    ? profiles.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(q)
      )
    : profiles;

  return {
    data: {
      items,
      ok: true
    },
    status: 200
  };
}

async function getEmailMessage({ env, validated }) {
  const message = await getJson(env, `email_messages/${validated.params.message_id}.json`);

  if (!message) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      message,
      ok: true
    },
    status: 200
  };
}

async function getEmailMessagesByAccount({ env, validated }) {
  const items = await listByField(env, "email_messages/", "accountId", validated.params.account_id);

  return {
    data: {
      items,
      ok: true
    },
    status: 200
  };
}

async function getHealth() {
  return {
    data: {
      ok: true,
      service: "taxmonitor-pro-api",
      status: "ok"
    },
    status: 200
  };
}

async function getInquiry({ env, validated }) {
  const inquiry = await getJson(env, `inquiries/${validated.params.inquiry_id}.json`);

  if (!inquiry) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      inquiry,
      ok: true
    },
    status: 200
  };
}

async function getInquiriesByAccount({ env, validated }) {
  const items = await listByField(env, "inquiries/", "accountId", validated.params.account_id);

  return {
    data: {
      items,
      ok: true
    },
    status: 200
  };
}

async function getNotificationsInApp({ env, validated }) {
  const accountId =
    validated.query?.account_id ||
    validated.headers?.["x-account-id"] ||
    null;

  if (!accountId) {
    return {
      data: {
        error: "missing_account_id",
        ok: false
      },
      status: 400
    };
  }

  const items = await listByField(env, "notifications_in_app/", "accountId", accountId);

  return {
    data: {
      items,
      ok: true
    },
    status: 200
  };
}

async function getNotificationsPreferences({ env, validated }) {
  const account = await getJson(env, `taxpayer_accounts/${validated.params.account_id}.json`);

  return {
    data: {
      notificationPreferences: account?.notificationPreferences || {
        inApp: true,
        sms: false
      },
      ok: true
    },
    status: 200
  };
}

async function getPricing({ env }) {
  const plans = [
    {
      billingPeriod: "monthly",
      price: toNumber(env.TMP_PLAN_ESSENTIAL_MONTHLY_PRICE),
      priceId: env.STRIPE_TMP_PRICE_ESSENTIAL_MONTHLY || null,
      taxToolTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS),
      tier: "essential",
      transcriptTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "yearly",
      price: toNumber(env.TMP_PLAN_ESSENTIAL_YEARLY_PRICE),
      priceId: env.STRIPE_TMP_PRICE_ESSENTIAL_YEARLY || null,
      taxToolTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS),
      tier: "essential",
      transcriptTokens: toNumber(env.TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "monthly",
      price: 0,
      priceId: env.STRIPE_TMP_PRICE_FREE_MONTHLY || null,
      taxToolTokens: toNumber(env.TMP_PLAN_FREE_TAX_TOOL_TOKENS),
      tier: "free",
      transcriptTokens: toNumber(env.TMP_PLAN_FREE_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "monthly",
      price: toNumber(env.TMP_PLAN_PLUS_MONTHLY_PRICE),
      priceId: env.STRIPE_TMP_PRICE_PLUS_MONTHLY || null,
      taxToolTokens: toNumber(env.TMP_PLAN_PLUS_TAX_TOOL_TOKENS),
      tier: "plus",
      transcriptTokens: toNumber(env.TMP_PLAN_PLUS_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "yearly",
      price: toNumber(env.TMP_PLAN_PLUS_YEARLY_PRICE),
      priceId: env.STRIPE_TMP_PRICE_PLUS_YEARLY || null,
      taxToolTokens: toNumber(env.TMP_PLAN_PLUS_TAX_TOOL_TOKENS),
      tier: "plus",
      transcriptTokens: toNumber(env.TMP_PLAN_PLUS_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "monthly",
      price: toNumber(env.TMP_PLAN_PREMIER_MONTHLY_PRICE),
      priceId: env.STRIPE_TMP_PRICE_PREMIER_MONTHLY || null,
      taxToolTokens: toNumber(env.TMP_PLAN_PREMIER_TAX_TOOL_TOKENS),
      tier: "premier",
      transcriptTokens: toNumber(env.TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS)
    },
    {
      billingPeriod: "yearly",
      price: toNumber(env.TMP_PLAN_PREMIER_YEARLY_PRICE),
      priceId: env.STRIPE_TMP_PRICE_PREMIER_YEARLY || null,
      taxToolTokens: toNumber(env.TMP_PLAN_PREMIER_TAX_TOOL_TOKENS),
      tier: "premier",
      transcriptTokens: toNumber(env.TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS)
    }
  ];

  return {
    data: {
      ok: true,
      plans
    },
    status: 200
  };
}

async function getSupportTicket({ env, validated }) {
  const ticket = await getJson(env, `support_tickets/${validated.params.ticket_id}.json`);

  if (!ticket) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      ok: true,
      ticket
    },
    status: 200
  };
}

async function getSupportTicketsByAccount({ env, validated }) {
  const items = await listByField(env, "support_tickets/", "accountId", validated.params.account_id);

  return {
    data: {
      items,
      ok: true
    },
    status: 200
  };
}

async function getTaxpayerAccount({ env, validated }) {
  const account = await getJson(env, `taxpayer_accounts/${validated.params.account_id}.json`);

  if (!account) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      account,
      ok: true
    },
    status: 200
  };
}

async function getTaxpayerMembership({ env, validated }) {
  const membership = await getJson(env, `taxpayer_memberships/${validated.params.membership_id}.json`);

  if (!membership) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  return {
    data: {
      membership,
      ok: true
    },
    status: 200
  };
}

async function getTaxpayerMembershipsByAccount({ env, validated }) {
  const items = await listByField(env, "taxpayer_memberships/", "accountId", validated.params.account_id);

  return {
    data: {
      items,
      ok: true
    },
    status: 200
  };
}

async function patchNotificationsPreferences({ env, validated }) {
  const key = `taxpayer_accounts/${validated.params.account_id}.json`;
  const existing = (await getJson(env, key)) || {
    accountId: validated.params.account_id,
    createdAt: new Date().toISOString()
  };

  const next = mergeAccountNotificationPreferences(existing, validated.body || {});
  await putJson(env, key, next);

  return {
    data: {
      notificationPreferences: next.notificationPreferences,
      ok: true,
      updated: true
    },
    status: 200
  };
}

async function patchSupportTicket({ env, validated }) {
  const key = `support_tickets/${validated.params.ticket_id}.json`;
  const existing = await getJson(env, key);

  if (!existing) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  const next = {
    ...existing,
    ...validated.body,
    ticketId: validated.params.ticket_id,
    updatedAt: new Date().toISOString()
  };

  await putJson(env, key, next);

  return {
    data: {
      ok: true,
      ticket: next,
      updated: true
    },
    status: 200
  };
}

async function patchTaxpayerAccount({ contract, env, route, validated }) {
  const result = await executeWritePipeline({
    contract,
    env,
    requestContext: validated,
    route
  });

  return {
    data: {
      account: result?.canonicalRecord?.record || null,
      ok: true,
      updated: true
    },
    status: 200
  };
}

async function patchTaxpayerMembership({ env, validated }) {
  const key = `taxpayer_memberships/${validated.params.membership_id}.json`;
  const existing = await getJson(env, key);

  if (!existing) {
    return {
      data: {
        error: "not_found",
        ok: false
      },
      status: 404
    };
  }

  const next = {
    ...existing,
    ...validated.body,
    membershipId: validated.params.membership_id,
    updatedAt: new Date().toISOString()
  };

  await putJson(env, key, next);

  return {
    data: {
      membership: next,
      ok: true,
      updated: true
    },
    status: 200
  };
}

async function postCheckoutSessions({ env, validated }) {
  if (!env.STRIPE_SECRET_KEY) {
    return notImplemented("Stripe secret is not configured for checkout sessions.");
  }

  const plan = String(validated.body?.plan || "").toLowerCase();
  const billingPeriod = String(validated.body?.billingPeriod || "monthly").toLowerCase();
  const successUrl = validated.body?.successUrl;
  const cancelUrl = validated.body?.cancelUrl;

  if (!successUrl || !cancelUrl) {
    return {
      data: {
        error: "missing_success_or_cancel_url",
        ok: false
      },
      status: 400
    };
  }

  const priceId = resolveStripePriceId(env, plan, billingPeriod);

  if (!priceId) {
    return {
      data: {
        error: "invalid_plan_or_billing_period",
        ok: false
      },
      status: 400
    };
  }

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl);
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");

  if (validated.body?.accountId) {
    form.set("client_reference_id", String(validated.body.accountId));
  }

  if (validated.body?.email) {
    form.set("customer_email", String(validated.body.email));
  }

  form.set("metadata[app]", "tax-monitor-pro");
  form.set("metadata[membership_type]", "taxpayer");
  form.set("metadata[plan]", plan);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body: form,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });

  const payload = await response.json();

  return {
    data: {
      checkoutSession: payload,
      ok: response.ok
    },
    status: response.ok ? 200 : 502
  };
}

async function postEmailSend() {
  return notImplemented("Google email send is not wired in this Worker yet.");
}

async function postInquiries({ contract, env, route, validated }) {
  const result = await executeWritePipeline({
    contract,
    env,
    requestContext: validated,
    route
  });

  return {
    data: {
      inquiry: result?.canonicalRecord?.record || null,
      ok: true,
      status: "submitted"
    },
    status: 201
  };
}

async function postNotificationsInApp({ env, validated }) {
  const notificationId = validated.body?.notificationId || crypto.randomUUID();
  const record = {
    accountId: validated.body?.accountId || null,
    body: validated.body?.body || "",
    createdAt: new Date().toISOString(),
    notificationId,
    read: false,
    title: validated.body?.title || ""
  };

  await putJson(env, `notifications_in_app/${notificationId}.json`, record);

  return {
    data: {
      notification: record,
      ok: true
    },
    status: 201
  };
}

async function postNotificationsSmsSend() {
  return notImplemented("Twilio SMS send is not wired in this Worker yet.");
}

async function postSupportTickets({ env, validated }) {
  const ticketId = validated.body?.ticketId || crypto.randomUUID();
  const record = {
    accountId: validated.body?.accountId || null,
    body: validated.body?.body || "",
    createdAt: new Date().toISOString(),
    priority: validated.body?.priority || "normal",
    status: "open",
    subject: validated.body?.subject || "",
    ticketId,
    updatedAt: new Date().toISOString()
  };

  await putJson(env, `support_tickets/${ticketId}.json`, record);

  return {
    data: {
      ok: true,
      ticket: record
    },
    status: 201
  };
}

async function postTaxpayerMembershipsFree({ contract, env, route, validated }) {
  const result = await executeWritePipeline({
    contract,
    env,
    requestContext: validated,
    route
  });

  return {
    data: {
      membership: result?.canonicalRecord?.record || null,
      ok: true,
      status: "active",
      tier: "free"
    },
    status: 201
  };
}

async function postWebhooksGoogleEmail({ contract, env, route, validated }) {
  await appendReceipt({
    contract,
    env,
    requestContext: validated,
    route
  });

  return {
    data: {
      ok: true,
      received: true
    },
    status: 202
  };
}

async function postWebhooksStripe({ contract, env, route, validated }) {
  await appendReceipt({
    contract,
    env,
    requestContext: validated,
    route
  });

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return notImplemented("Stripe webhook secret is not configured.");
  }

  if (!validated.rawBody) {
    return {
      data: {
        error: "missing_raw_body",
        ok: false
      },
      status: 400
    };
  }

  const signature = validated.headers?.["stripe-signature"] || "";
  const verified = await verifyStripeSignature(validated.rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  if (!verified) {
    return {
      data: {
        error: "invalid_signature",
        ok: false
      },
      status: 400
    };
  }

  const event = safeJson(validated.rawBody);

  if (event?.type === "checkout.session.completed") {
    const object = event.data?.object || {};
    const membershipId = object.id || crypto.randomUUID();
    const accountId = object.client_reference_id || null;
    const plan = object.metadata?.plan || "unknown";

    const record = {
      accountId,
      checkoutCompletedAt: new Date().toISOString(),
      email: object.customer_details?.email || null,
      membershipId,
      plan,
      provider: "stripe",
      status: "active",
      stripeCheckoutSessionId: object.id || null,
      stripeCustomerId: object.customer || null,
      updatedAt: new Date().toISOString()
    };

    await putJson(env, `taxpayer_memberships/${membershipId}.json`, record);
  }

  return {
    data: {
      ok: true,
      received: true
    },
    status: 200
  };
}

async function postWebhooksTwilio({ contract, env, route, validated }) {
  await appendReceipt({
    contract,
    env,
    requestContext: validated,
    route
  });

  return {
    data: {
      ok: true,
      received: true
    },
    status: 202
  };
}

/* ------------------------------------------
 * Auth Helpers
 * ------------------------------------------ */

/**
 * Upsert a TMP account by email.
 * - If email exists in D1: update last_login_at, return existing account.
 * - If email not found: create ACCT_{UUID}, write receipt → R2 → D1.
 * - Role is set at creation and never changed via this function.
 * - New accounts via OAuth/SSO always get role = 'taxpayer' (Google) or 'taxpro' (SSO).
 */
async function upsertAccount(env, { email, displayName, role = "taxpayer" }) {
  // Check D1 for existing account
  let existing = null;
  try {
    existing = await env.DB.prepare(
      "SELECT account_id, email, role, plan FROM tmp_taxpayer_accounts WHERE email = ? LIMIT 1"
    )
      .bind(email)
      .first();
  } catch {
    // D1 unavailable — fall through to create path
  }

  if (existing) {
    const accountId = existing.account_id;
    const now = new Date().toISOString();

    // Update last_login_at in R2 canonical record
    const r2Key = `taxpayer_accounts/${accountId}.json`;
    const r2Record = (await getJson(env, r2Key)) || {};
    await putJson(env, r2Key, { ...r2Record, lastLoginAt: now, updatedAt: now });

    // Update last_login_at in D1
    try {
      await env.DB.prepare(
        "UPDATE tmp_taxpayer_accounts SET last_login_at = ?, updated_at = ? WHERE account_id = ?"
      )
        .bind(now, now, accountId)
        .run();
    } catch {}

    await writeActivityEvent(env, {
      accountId,
      action: "account_login",
      actorId: accountId
    });

    return {
      accountId,
      email,
      plan: existing.plan || "free",
      role: existing.role || "taxpayer"
    };
  }

  // Create new account
  const accountId = `ACCT_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const record = {
    accountId,
    createdAt: now,
    displayName: displayName || null,
    email,
    lastLoginAt: now,
    plan: "free",
    role,
    status: "active",
    updatedAt: now
  };

  // Step 1: Receipt R2
  const eventId = `EVT_${crypto.randomUUID()}`;
  await putJson(env, `receipts/tmp/auth/account-create/${eventId}.json`, {
    accountId,
    action: "account_created",
    email,
    eventId,
    receivedAt: now
  });

  // Step 2: Canonical R2
  await putJson(env, `taxpayer_accounts/${accountId}.json`, record);

  // Step 3: D1 projection
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO tmp_taxpayer_accounts
       (account_id, email, display_name, role, plan, status, created_at, updated_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(accountId, email, displayName || null, role, "free", "active", now, now, now)
      .run();
  } catch {}

  await writeActivityEvent(env, {
    accountId,
    action: "account_created",
    actorId: accountId
  });

  return { accountId, email, plan: "free", role };
}

/**
 * Write an audit event to D1 tmp_activity.
 * Best-effort — never throws. D1 failures are logged to console.
 */
async function writeActivityEvent(env, { accountId, action, resourceType, resourceId, actorId, metadata } = {}) {
  const eventId = `EVT_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO tmp_activity
       (event_id, account_id, action, resource_type, resource_id, actor_id, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        eventId,
        accountId || null,
        action,
        resourceType || null,
        resourceId || accountId || null,
        actorId || accountId || null,
        metadata ? JSON.stringify(metadata) : null,
        now
      )
      .run();
  } catch (err) {
    console.error("[TMP] Activity write failed:", action, err?.message);
  }
}

/**
 * Send magic link email via Gmail API using Google service account.
 * If GOOGLE_PRIVATE_KEY is not set, returns { sent: true, mock: true }.
 */
async function sendMagicLinkEmail(env, { email, magicLinkUrl }) {
  if (!env.GOOGLE_PRIVATE_KEY) {
    console.warn("[TMP] GOOGLE_PRIVATE_KEY not set — returning mock send");
    return { mock: true, sent: true };
  }

  try {
    const jwt = await createServiceAccountJwt(env, {
      scope: "https://www.googleapis.com/auth/gmail.send",
      sub: env.GOOGLE_WORKSPACE_USER_NO_REPLY || "no-reply@taxmonitor.pro"
    });

    const tokenRes = await fetch(env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token", {
      body: new URLSearchParams({
        assertion: jwt,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer"
      }),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "POST"
    });

    if (!tokenRes.ok) throw new Error("Service account token exchange failed");

    const { access_token } = await tokenRes.json();

    const from = env.GOOGLE_WORKSPACE_USER_NO_REPLY || "no-reply@taxmonitor.pro";
    const expiry = env.MAGIC_LINK_EXPIRATION_MINUTES || "15";

    const mime = [
      `From: ${from}`,
      `To: ${email}`,
      `Subject: Sign in to Tax Monitor Pro`,
      `Content-Type: text/plain; charset=utf-8`,
      ``,
      `Click the link below to sign in to Tax Monitor Pro.`,
      `This link expires in ${expiry} minutes.`,
      ``,
      magicLinkUrl,
      ``,
      `If you did not request this link, you can safely ignore this email.`
    ].join("\r\n");

    const rawEmail = b64uEncode(new TextEncoder().encode(mime));

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      body: JSON.stringify({ raw: rawEmail }),
      headers: {
        Authorization: `Bearer ${access_token}`,
        "content-type": "application/json"
      },
      method: "POST"
    });

    if (!sendRes.ok) throw new Error("Gmail send failed");

    return { sent: true };
  } catch (err) {
    console.error("[TMP] Magic link email failed:", err?.message);
    return { error: err?.message, sent: false };
  }
}

/**
 * Create a signed JWT for Google service account authentication.
 * Signs with GOOGLE_PRIVATE_KEY (PKCS8 PEM, RSA-SHA256).
 */
async function createServiceAccountJwt(env, { scope, sub }) {
  const iss = env.GOOGLE_CLIENT_EMAIL;
  const aud = env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);

  const headerB64 = b64uEncode(
    new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  );
  const payloadB64 = b64uEncode(
    new TextEncoder().encode(JSON.stringify({ aud, exp: now + 3600, iat: now, iss, scope, sub }))
  );
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import PKCS8 private key (Google service account PEM)
  const pem = String(env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const derBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    derBytes.buffer,
    { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" },
    false,
    ["sign"]
  );

  const sigBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${b64uEncode(sigBytes)}`;
}

/**
 * Verify OIDC ID token via JWKS discovery.
 * Fetches discovery document, finds matching JWK by kid, verifies signature.
 * Supports RS256/RS384/RS512 and ES256/ES384/ES512.
 */
async function verifyOidcIdToken(env, idToken) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const header = JSON.parse(decodeBase64url(parts[0]));
  const payload = JSON.parse(decodeBase64url(parts[1]));

  const issuer = String(env.SSO_OIDC_ISSUER || "").replace(/\/$/, "");

  // Fetch OIDC discovery
  const discovery = await fetch(`${issuer}/.well-known/openid-configuration`).then((r) => r.json());
  const jwks = await fetch(discovery.jwks_uri).then((r) => r.json());

  // Find matching JWK (by kid if present, otherwise use first)
  const jwk = jwks.keys.find((k) => !header.kid || k.kid === header.kid);
  if (!jwk) throw new Error("No matching JWK found for kid: " + header.kid);

  // Determine algorithm parameters
  const alg = header.alg || "RS256";
  let importParams;
  let verifyAlg;

  if (alg.startsWith("RS")) {
    importParams = { hash: `SHA-${alg.slice(2)}`, name: "RSASSA-PKCS1-v1_5" };
    verifyAlg = "RSASSA-PKCS1-v1_5";
  } else if (alg.startsWith("ES")) {
    const curve = alg === "ES256" ? "P-256" : alg === "ES384" ? "P-384" : "P-521";
    importParams = { hash: `SHA-${alg.slice(2)}`, name: "ECDSA", namedCurve: curve };
    verifyAlg = { hash: `SHA-${alg.slice(2)}`, name: "ECDSA" };
  } else {
    throw new Error(`Unsupported algorithm: ${alg}`);
  }

  const key = await crypto.subtle.importKey("jwk", jwk, importParams, false, ["verify"]);

  const signingInput = `${parts[0]}.${parts[1]}`;
  const sig = Uint8Array.from(atob(decodeBase64urlToRaw(parts[2])), (c) => c.charCodeAt(0));

  const valid = await crypto.subtle.verify(
    verifyAlg,
    key,
    sig,
    new TextEncoder().encode(signingInput)
  );

  if (!valid) throw new Error("Invalid JWT signature");

  // Check expiry
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("ID token expired");
  }

  return payload;
}

/**
 * Verify SAML assertion signature using IdP X.509 certificate.
 *
 * NOTE: Full XMLDSig requires Exclusive Canonicalization (exc-c14n) of <SignedInfo>
 * before verifying. This implementation verifies against the raw <SignedInfo> string,
 * which works for IdPs that produce canonical XML without namespace re-ordering.
 * For strict production compliance, replace with a proper XMLDSig library.
 */
async function verifySamlSignature(xmlStr, certPem) {
  try {
    // Extract SignatureValue
    const sigValue =
      extractXmlContent(xmlStr, "ds:SignatureValue") ||
      extractXmlContent(xmlStr, "SignatureValue");
    if (!sigValue) return false;

    // Locate <SignedInfo> element
    const siTag = xmlStr.includes("<ds:SignedInfo") ? "ds:SignedInfo" : "SignedInfo";
    const siStart = xmlStr.indexOf(`<${siTag}`);
    const siEnd = xmlStr.indexOf(`</${siTag}>`) + `</${siTag}>`.length;
    if (siStart < 0 || siEnd <= siStart) return false;

    const signedInfo = xmlStr.slice(siStart, siEnd);

    // Detect hash algorithm from SignatureMethod Algorithm attribute
    const sigMethodMatch = xmlStr.match(/SignatureMethod[^>]+Algorithm="([^"]+)"/);
    const sigAlgorithmUri = sigMethodMatch?.[1] || "";
    const usesSha256 =
      sigAlgorithmUri.includes("rsa-sha256") || sigAlgorithmUri.includes("rsa-sha384");

    // Import IdP X.509 certificate public key
    const publicKey = await importX509PublicKey(
      certPem,
      usesSha256 ? "SHA-256" : "SHA-1"
    );

    // Decode and verify signature
    const sigBytes = Uint8Array.from(
      atob(sigValue.replace(/\s+/g, "")),
      (c) => c.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      sigBytes,
      new TextEncoder().encode(signedInfo)
    );
  } catch (err) {
    console.error("[TMP] SAML signature error:", err?.message);
    return false;
  }
}

/**
 * Import an X.509 PEM certificate as a Web Crypto CryptoKey (public key).
 * Extracts SubjectPublicKeyInfo from the DER-encoded certificate.
 */
async function importX509PublicKey(pem, hashAlg = "SHA-256") {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const certDer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const spki = extractSpkiFromCert(certDer);

  return crypto.subtle.importKey(
    "spki",
    spki,
    { hash: hashAlg, name: "RSASSA-PKCS1-v1_5" },
    false,
    ["verify"]
  );
}

/**
 * Extract SubjectPublicKeyInfo bytes from a DER-encoded X.509 certificate.
 * Implements a minimal TLV parser for the ASN.1 DER structure.
 *
 * Certificate ASN.1:
 *   SEQUENCE {
 *     TBSCertificate SEQUENCE { version[0], serialNumber, signature, issuer,
 *                               validity, subject, subjectPublicKeyInfo, ... }
 *     signatureAlgorithm SEQUENCE
 *     signature BIT STRING
 *   }
 */
function extractSpkiFromCert(certDer) {
  // Read a TLV (Tag-Length-Value) from certDer at offset
  function readTlv(bytes, offset) {
    let pos = offset + 1; // skip tag byte
    let len = bytes[pos++];
    if (len & 0x80) {
      const numBytes = len & 0x7f;
      len = 0;
      for (let i = 0; i < numBytes; i++) len = (len << 8) | bytes[pos++];
    }
    return { contentStart: pos, end: pos + len, start: offset, tag: bytes[offset] };
  }

  // Iterate immediate children of a SEQUENCE TLV
  function children(bytes, seqTlv) {
    const result = [];
    let pos = seqTlv.contentStart;
    while (pos < seqTlv.end) {
      const child = readTlv(bytes, pos);
      result.push(child);
      pos = child.end;
    }
    return result;
  }

  const cert = readTlv(certDer, 0); // outer Certificate SEQUENCE
  const certKids = children(certDer, cert);
  const tbs = certKids[0]; // TBSCertificate SEQUENCE
  const tbsKids = children(certDer, tbs);

  // TBSCertificate v3 fields (with explicit [0] version):
  //   0: version [0]  1: serialNumber  2: signature  3: issuer
  //   4: validity     5: subject       6: subjectPublicKeyInfo
  // TBSCertificate v1 (no version):
  //   0: serialNumber  1: signature  2: issuer
  //   3: validity      4: subject    5: subjectPublicKeyInfo
  const hasVersion = certDer[tbs.contentStart] === 0xa0;
  const spkiIdx = hasVersion ? 6 : 5;

  if (!tbsKids[spkiIdx]) throw new Error("SPKI not found in X.509 certificate");

  const spki = tbsKids[spkiIdx];
  return certDer.slice(spki.start, spki.end);
}

/**
 * Deflate bytes using raw DEFLATE (CompressionStream deflate-raw).
 * Required for SAML HTTP-Redirect binding AuthnRequest encoding.
 */
async function deflateRaw(data) {
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  const reader = cs.readable.getReader();

  await writer.write(data);
  await writer.close();

  const chunks = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/* ------------------------------------------
 * XML Parsing Helpers (SAML)
 * ------------------------------------------ */

function extractXmlContent(xml, tagName) {
  const open = `<${tagName}`;
  const close = `</${tagName}>`;
  const start = xml.indexOf(open);
  if (start < 0) return null;
  const contentStart = xml.indexOf(">", start) + 1;
  const end = xml.indexOf(close, contentStart);
  if (end < 0) return null;
  return xml.slice(contentStart, end).trim() || null;
}

function extractXmlAttr(xml, attrName, tagHint) {
  // Find attribute value in the XML, optionally within a specific tag context
  const search = tagHint ? xml.slice(xml.indexOf(`<${tagHint}`) >= 0 ? xml.indexOf(`<${tagHint}`) : 0) : xml;
  const re = new RegExp(`${attrName}="([^"]+)"`);
  const match = search.match(re);
  return match ? match[1] : null;
}

function extractSamlAttribute(xml, attrName) {
  // Handles <saml:Attribute Name="attrName"><saml:AttributeValue>val</...>
  const nameStr = `Name="${attrName}"`;
  const start = xml.indexOf(nameStr);
  if (start < 0) return null;

  // Find the AttributeValue content after this Attribute element starts
  const avOpenTag = ["<saml:AttributeValue>", "<AttributeValue>"].find(
    (t) => xml.indexOf(t, start) >= 0
  );
  if (!avOpenTag) return null;

  const avStart = xml.indexOf(avOpenTag, start);
  if (avStart < 0) return null;

  const avClose = avOpenTag.replace("<", "</");
  const contentStart = avStart + avOpenTag.length;
  const contentEnd = xml.indexOf(avClose, contentStart);
  if (contentEnd < 0) return null;

  return xml.slice(contentStart, contentEnd).trim() || null;
}

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function notImplemented(message) {
  return {
    data: {
      error: "not_implemented",
      message,
      ok: false
    },
    status: 501
  };
}

function jsonError(error, status) {
  return new Response(JSON.stringify({ error, ok: false }), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status
  });
}

function readDirectoryProfiles(env) {
  try {
    const value = JSON.parse(env.TMP_DIRECTORY_JSON || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function resolveStripePriceId(env, plan, billingPeriod) {
  const key = `${plan}:${billingPeriod}`;

  const map = {
    "essential:monthly": env.STRIPE_TMP_PRICE_ESSENTIAL_MONTHLY,
    "essential:yearly": env.STRIPE_TMP_PRICE_ESSENTIAL_YEARLY,
    "plus:monthly": env.STRIPE_TMP_PRICE_PLUS_MONTHLY,
    "plus:yearly": env.STRIPE_TMP_PRICE_PLUS_YEARLY,
    "premier:monthly": env.STRIPE_TMP_PRICE_PREMIER_MONTHLY,
    "premier:yearly": env.STRIPE_TMP_PRICE_PREMIER_YEARLY
  };

  return map[key] || null;
}

function safeJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function verifyStripeSignature(payload, signatureHeader, secret) {
  const timestamp = extractStripeTimestamp(signatureHeader);
  const signatures = extractStripeSignatures(signatureHeader);

  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return signatures.some((value) => timingSafeEqual(value, hex));
}

function extractStripeTimestamp(header) {
  const parts = String(header || "").split(",");
  const match = parts.find((part) => part.startsWith("t="));
  return match ? match.slice(2) : "";
}

function extractStripeSignatures(header) {
  return String(header || "")
    .split(",")
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
}

/* ------------------------------------------
 * Base64 / Encoding Utilities
 * ------------------------------------------ */

function b64uEncode(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64Encode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64url(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return atob(s);
}

function decodeBase64urlToRaw(str) {
  return decodeBase64url(str);
}
