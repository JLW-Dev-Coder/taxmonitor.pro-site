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

export async function dispatchHandler({ contract, env, route, validated }) {
  const handler = HANDLERS[route?.handler];

  if (!handler) {
    throw new Error(`No handler registered for ${route?.handler}`);
  }

  return await handler({
    contract,
    env,
    route,
    validated
  });
}

/* ------------------------------------------
 * Route Handlers
 * ------------------------------------------ */

async function getAuthGoogleCallback() {
  return notImplemented("Google callback is not wired in this Worker yet.");
}

async function getAuthGoogleStart() {
  return notImplemented("Google start is not wired in this Worker yet.");
}

async function getAuthMagicLinkVerify() {
  return notImplemented("Magic link verify is not wired in this Worker yet.");
}

async function getAuthSession({ validated }) {
  const accountId =
    validated.query?.account_id ||
    validated.headers?.["x-account-id"] ||
    null;

  return {
    data: {
      accountId,
      authenticated: Boolean(accountId),
      ok: true,
      session: accountId
        ? {
            accountId,
            authenticated: true
          }
        : null
    },
    status: 200
  };
}

async function getAuthSsoOidcCallback() {
  return notImplemented("OIDC callback is not wired in this Worker yet.");
}

async function getAuthSsoOidcStart() {
  return notImplemented("OIDC start is not wired in this Worker yet.");
}

async function getAuthSsoSamlStart() {
  return notImplemented("SAML start is not wired in this Worker yet.");
}

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

async function postAuthLogout() {
  return {
    data: {
      loggedOut: true,
      ok: true
    },
    status: 200
  };
}

async function postAuthMagicLinkRequest() {
  return notImplemented("Magic link request is not wired in this Worker yet.");
}

async function postAuthSsoSamlAcs() {
  return notImplemented("SAML ACS is not wired in this Worker yet.");
}

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

  return notImplemented("2FA challenge verification needs a real challenge provider.");
}

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

  return {
    data: {
      disabled: true,
      ok: true
    },
    status: 200
  };
}

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

  return {
    data: {
      enabled: true,
      ok: true
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

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function verifyStripeSignature(payload, signatureHeader, secret) {
  const timestamp = extractStripeTimestamp(signatureHeader);
  const signatures = extractStripeSignatures(signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );

  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );

  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

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
