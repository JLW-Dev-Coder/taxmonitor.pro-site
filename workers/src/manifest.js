/* ------------------------------------------
 * Router
 * ------------------------------------------ */

export const TMP_API_ROUTES = [
  {
    contractKey: null,
    handler: "getHealth",
    method: "GET",
    path: "/health",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.auth.2fa.status.get.v1.json",
    handler: "getAuthTwoFactorStatus",
    method: "GET",
    path: "/v1/auth/2fa/status/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.google.callback.v1.json",
    handler: "getAuthGoogleCallback",
    method: "GET",
    path: "/v1/auth/google/callback",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.auth.google.start.v1.json",
    handler: "getAuthGoogleStart",
    method: "GET",
    path: "/v1/auth/google/start",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.auth.magic-link.verify.v1.json",
    handler: "getAuthMagicLinkVerify",
    method: "GET",
    path: "/v1/auth/magic-link/verify",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.auth.session.get.v1.json",
    handler: "getAuthSession",
    method: "GET",
    path: "/v1/auth/session",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.sso.oidc.callback.v1.json",
    handler: "getAuthSsoOidcCallback",
    method: "GET",
    path: "/v1/auth/sso/oidc/callback",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.auth.sso.oidc.start.v1.json",
    handler: "getAuthSsoOidcStart",
    method: "GET",
    path: "/v1/auth/sso/oidc/start",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.auth.sso.saml.start.v1.json",
    handler: "getAuthSsoSamlStart",
    method: "GET",
    path: "/v1/auth/sso/saml/start",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.membership.checkout-status.get.v1.json",
    handler: "getCheckoutStatus",
    method: "GET",
    path: "/v1/checkout/status",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.directory.professional.get.v1.json",
    handler: "getDirectoryProfessional",
    method: "GET",
    path: "/v1/directory/professionals/{professional_id}",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.directory.search.v1.json",
    handler: "getDirectoryProfessionals",
    method: "GET",
    path: "/v1/directory/professionals",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.email.message.get.v1.json",
    handler: "getEmailMessage",
    method: "GET",
    path: "/v1/email/messages/{message_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.email.message.list-by-account.v1.json",
    handler: "getEmailMessagesByAccount",
    method: "GET",
    path: "/v1/email/messages/by-account/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.inquiry.get.v1.json",
    handler: "getInquiry",
    method: "GET",
    path: "/v1/inquiries/{inquiry_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.inquiry.list-by-account.v1.json",
    handler: "getInquiriesByAccount",
    method: "GET",
    path: "/v1/inquiries/by-account/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.notifications.in-app.list.v1.json",
    handler: "getNotificationsInApp",
    method: "GET",
    path: "/v1/notifications/in-app",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.notifications.preferences.get.v1.json",
    handler: "getNotificationsPreferences",
    method: "GET",
    path: "/v1/notifications/preferences/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.membership.pricing.get.v1.json",
    handler: "getPricing",
    method: "GET",
    path: "/v1/pricing",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.support.ticket.get.v1.json",
    handler: "getSupportTicket",
    method: "GET",
    path: "/v1/support/tickets/{ticket_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.support.ticket.list-by-account.v1.json",
    handler: "getSupportTicketsByAccount",
    method: "GET",
    path: "/v1/support/tickets/by-account/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.taxpayer-account.get.v1.json",
    handler: "getTaxpayerAccount",
    method: "GET",
    path: "/v1/taxpayer-accounts/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.membership.get.v1.json",
    handler: "getTaxpayerMembership",
    method: "GET",
    path: "/v1/taxpayer-memberships/{membership_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.membership.list-by-account.v1.json",
    handler: "getTaxpayerMembershipsByAccount",
    method: "GET",
    path: "/v1/taxpayer-memberships/by-account/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.notifications.preferences.patch.v1.json",
    handler: "patchNotificationsPreferences",
    method: "PATCH",
    path: "/v1/notifications/preferences/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.support.ticket.patch.v1.json",
    handler: "patchSupportTicket",
    method: "PATCH",
    path: "/v1/support/tickets/{ticket_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.taxpayer-account.update.v1.json",
    handler: "patchTaxpayerAccount",
    method: "PATCH",
    path: "/v1/taxpayer-accounts/{account_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.membership.patch.v1.json",
    handler: "patchTaxpayerMembership",
    method: "PATCH",
    path: "/v1/taxpayer-memberships/{membership_id}",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.2fa.challenge-verify.v1.json",
    handler: "postAuthTwoFactorChallengeVerify",
    method: "POST",
    path: "/v1/auth/2fa/challenge/verify",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.2fa.disable.v1.json",
    handler: "postAuthTwoFactorDisable",
    method: "POST",
    path: "/v1/auth/2fa/disable",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.2fa.enroll-init.v1.json",
    handler: "postAuthTwoFactorEnrollInit",
    method: "POST",
    path: "/v1/auth/2fa/enroll/init",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.2fa.enroll-verify.v1.json",
    handler: "postAuthTwoFactorEnrollVerify",
    method: "POST",
    path: "/v1/auth/2fa/enroll/verify",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.logout.v1.json",
    handler: "postAuthLogout",
    method: "POST",
    path: "/v1/auth/logout",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.auth.magic-link.request.v1.json",
    handler: "postAuthMagicLinkRequest",
    method: "POST",
    path: "/v1/auth/magic-link/request",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.auth.sso.saml.acs.v1.json",
    handler: "postAuthSsoSamlAcs",
    method: "POST",
    path: "/v1/auth/sso/saml/acs",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.membership.checkout-session.create.v1.json",
    handler: "postCheckoutSessions",
    method: "POST",
    path: "/v1/checkout/sessions",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.email.send.v1.json",
    handler: "postEmailSend",
    method: "POST",
    path: "/v1/email/send",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.inquiry.create.v1.json",
    handler: "postInquiries",
    method: "POST",
    path: "/v1/inquiries",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.notifications.in-app.create.v1.json",
    handler: "postNotificationsInApp",
    method: "POST",
    path: "/v1/notifications/in-app",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.notifications.sms.send.v1.json",
    handler: "postNotificationsSmsSend",
    method: "POST",
    path: "/v1/notifications/sms/send",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.support.ticket.create.v1.json",
    handler: "postSupportTickets",
    method: "POST",
    path: "/v1/support/tickets",
    visibility: "private"
  },
  {
    contractKey: "contracts/tmp.membership.free.create.v1.json",
    handler: "postTaxpayerMembershipsFree",
    method: "POST",
    path: "/v1/taxpayer-memberships/free",
    visibility: "public"
  },
  {
    contractKey: "contracts/tmp.webhooks.google-email.v1.json",
    handler: "postWebhooksGoogleEmail",
    method: "POST",
    path: "/v1/webhooks/google-email",
    visibility: "system"
  },
  {
    contractKey: "contracts/tmp.webhooks.stripe.v1.json",
    handler: "postWebhooksStripe",
    method: "POST",
    path: "/v1/webhooks/stripe",
    visibility: "system"
  },
  {
    contractKey: "contracts/tmp.webhooks.twilio.v1.json",
    handler: "postWebhooksTwilio",
    method: "POST",
    path: "/v1/webhooks/twilio",
    visibility: "system"
  }
];

export function findRoute(method, pathname) {
  for (const route of TMP_API_ROUTES) {
    const match = matchPath(route.path, pathname);
    if (route.method === method && match.matched) {
      return {
        ...route,
        params: match.params
      };
    }
  }

  return null;
}

export function listRoutes() {
  return [...TMP_API_ROUTES];
}

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function matchPath(routePath, actualPath) {
  const left = normalizePath(routePath).split("/");
  const right = normalizePath(actualPath).split("/");

  if (left.length !== right.length) {
    return { matched: false, params: {} };
  }

  const params = {};

  for (let i = 0; i < left.length; i += 1) {
    const a = left[i];
    const b = right[i];

    if (a.startsWith("{") && a.endsWith("}")) {
      params[a.slice(1, -1)] = b;
      continue;
    }

    if (a !== b) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

function normalizePath(pathname) {
  const value = String(pathname || "")
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");

  return value || "/";
}
