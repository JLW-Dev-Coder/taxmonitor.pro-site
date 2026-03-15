/**
 * Tax Monitor Pro — Cloudflare Worker (TMP taxpayer API)
 *
 * Inbound routes:
 * - GET  /health
 * - GET  /v1/auth/2fa/status/{account_id}
 * - GET  /v1/auth/google/callback
 * - GET  /v1/auth/google/start
 * - GET  /v1/auth/magic-link/verify
 * - GET  /v1/auth/session
 * - GET  /v1/auth/sso/oidc/callback
 * - GET  /v1/auth/sso/oidc/start
 * - GET  /v1/auth/sso/saml/start
 * - GET  /v1/checkout/status
 * - GET  /v1/directory/professionals
 * - GET  /v1/directory/professionals/{professional_id}
 * - GET  /v1/email/messages/{message_id}
 * - GET  /v1/email/messages/by-account/{account_id}
 * - GET  /v1/inquiries/{inquiry_id}
 * - GET  /v1/inquiries/by-account/{account_id}
 * - GET  /v1/notifications/in-app
 * - GET  /v1/notifications/preferences/{account_id}
 * - GET  /v1/pricing
 * - GET  /v1/support/tickets/{ticket_id}
 * - GET  /v1/support/tickets/by-account/{account_id}
 * - GET  /v1/taxpayer-accounts/{account_id}
 * - GET  /v1/taxpayer-memberships/{membership_id}
 * - GET  /v1/taxpayer-memberships/by-account/{account_id}
 * - PATCH /v1/notifications/preferences/{account_id}
 * - PATCH /v1/support/tickets/{ticket_id}
 * - PATCH /v1/taxpayer-accounts/{account_id}
 * - PATCH /v1/taxpayer-memberships/{membership_id}
 * - POST /v1/auth/2fa/challenge/verify
 * - POST /v1/auth/2fa/disable
 * - POST /v1/auth/2fa/enroll/init
 * - POST /v1/auth/2fa/enroll/verify
 * - POST /v1/auth/logout
 * - POST /v1/auth/magic-link/request
 * - POST /v1/auth/sso/saml/acs
 * - POST /v1/checkout/sessions
 * - POST /v1/email/send
 * - POST /v1/inquiries
 * - POST /v1/notifications/in-app
 * - POST /v1/notifications/sms/send
 * - POST /v1/support/tickets
 * - POST /v1/taxpayer-memberships/free
 * - POST /v1/webhooks/google-email
 * - POST /v1/webhooks/stripe
 * - POST /v1/webhooks/twilio
 *
 * Implemented:
 * - TMP owns taxpayer discovery, inquiries, taxpayer memberships, and taxpayer dashboard APIs.
 * - R2 is authoritative; receipts precede canonical writes.
 * - Storage-backed TMP core routes are implemented.
 * - External provider routes return controlled 501 responses until wired.
 *
 * NOTE:
 * - Keep edits minimal and contract-safe.
 */

import { dispatchHandler } from "./handlers.js";
import { findRoute } from "./manifest.js";
import { loadContract, normalizeRequest, validateAgainstContract } from "./validate.js";

/* ------------------------------------------
 * Router
 * ------------------------------------------ */

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const route = findRoute(request.method, url.pathname);

      if (!route) {
        return json(
          {
            error: "not_found",
            ok: false,
            pathname: url.pathname
          },
          404
        );
      }

      const contract = await loadContract(env, route);
      const normalizedRequest = await normalizeRequest(request, route, url);
      const validation = validateAgainstContract({
        contract,
        request: normalizedRequest,
        route
      });

      if (!validation.ok) {
        return json(
          {
            details: validation.errors,
            error: "validation_failed",
            ok: false
          },
          400
        );
      }

      const result = await dispatchHandler({
        contract,
        env,
        route,
        validated: validation.value
      });

      return json(result.data || { ok: true }, result.status || 200);
    } catch (error) {
      return json(
        {
          error: "internal_error",
          message: error?.message || "Unhandled Worker error.",
          ok: false
        },
        500
      );
    }
  }
};

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    status
  });
}
