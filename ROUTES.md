# TMP Worker Route Surface
# api.taxmonitor.pro
# Read directly from workers/src/manifest.js
# Last updated: Phase 0 (pre-migration baseline)
# Total routes in manifest: 45
# Contracts in /contracts/: 43 tmp.*.v1.json files (+ 4 non-standard files)
# MISSING contract files (referenced in manifest, file absent): 1

---

## ROUTING RULES

- All routes are deny-by-default — unmatched paths return 404 JSON
- CORS locked to taxmonitor.pro and app.taxmonitor.pro only
- Every route must have a corresponding contract in /contracts/
- STUB = route is wired in manifest and handler exists, but handler returns 501 notImplemented
- YES = route is wired and handler returns real data
- MISSING = contract filename referenced in manifest.js but file does not exist on disk
- PLANNED = route is not yet in manifest.js — to be added in the noted phase

---

## Health

| Method | Path      | Manifest Status | Contract File | Handler Status    |
|--------|-----------|-----------------|---------------|-------------------|
| GET    | /health   | YES             | none          | Live — returns ok |

---

## Auth Routes — Core Session

| Method | Path                    | Manifest Status | Contract File                       | Handler Status |
|--------|-------------------------|-----------------|-------------------------------------|----------------|
| GET    | /v1/auth/session        | YES             | tmp.auth.session.get.v1.json        | Live (reads x-account-id header; real cookie auth wired in Phase 3) |
| POST   | /v1/auth/logout         | YES             | tmp.auth.logout.v1.json             | Live (returns loggedOut: true; cookie clear wired in Phase 3) |

## Auth Routes — Google OAuth

| Method | Path                        | Manifest Status | Contract File                          | Handler Status |
|--------|-----------------------------|-----------------|----------------------------------------|----------------|
| GET    | /v1/auth/google/start       | STUB            | tmp.auth.google.start.v1.json          | 501 — wire in Phase 3 |
| GET    | /v1/auth/google/callback    | STUB            | tmp.auth.google.callback.v1.json       | 501 — wire in Phase 3 |

## Auth Routes — Magic Link

| Method | Path                           | Manifest Status | Contract File                             | Handler Status |
|--------|--------------------------------|-----------------|-------------------------------------------|----------------|
| POST   | /v1/auth/magic-link/request    | STUB            | tmp.auth.magic-link.request.v1.json       | 501 — wire in Phase 3 |
| GET    | /v1/auth/magic-link/verify     | STUB            | tmp.auth.magic-link.verify.v1.json        | 501 — wire in Phase 3 |

## Auth Routes — SSO OIDC [Q7]

| Method | Path                          | Manifest Status | Contract File                           | Handler Status |
|--------|-------------------------------|-----------------|-----------------------------------------|----------------|
| GET    | /v1/auth/sso/oidc/start       | STUB            | tmp.auth.sso.oidc.start.v1.json         | 501 — wire fully in Phase 3 [Q7] |
| GET    | /v1/auth/sso/oidc/callback    | STUB            | tmp.auth.sso.oidc.callback.v1.json      | 501 — wire fully in Phase 3 [Q7] |

## Auth Routes — SSO SAML [Q7]

| Method | Path                          | Manifest Status | Contract File                           | Handler Status |
|--------|-------------------------------|-----------------|-----------------------------------------|----------------|
| GET    | /v1/auth/sso/saml/start       | STUB            | tmp.auth.sso.saml.start.v1.json         | 501 — wire fully in Phase 3 [Q7] |
| POST   | /v1/auth/sso/saml/acs         | STUB            | tmp.auth.sso.saml.acs.v1.json           | 501 — wire fully in Phase 3 [Q7] |

## Auth Routes — Two-Factor Authentication

| Method | Path                              | Manifest Status | Contract File                                | Handler Status |
|--------|-----------------------------------|-----------------|----------------------------------------------|----------------|
| GET    | /v1/auth/2fa/status/{account_id}  | YES             | tmp.auth.2fa.status.get.v1.json              | Live — reads R2 |
| POST   | /v1/auth/2fa/enroll/init          | YES             | tmp.auth.2fa.enroll-init.v1.json             | Live — writes R2 |
| POST   | /v1/auth/2fa/enroll/verify        | YES             | tmp.auth.2fa.enroll-verify.v1.json           | Live — writes R2 |
| POST   | /v1/auth/2fa/challenge/verify     | STUB            | tmp.auth.2fa.challenge-verify.v1.json        | 501 — needs TOTP provider (Phase 14) |
| POST   | /v1/auth/2fa/disable              | YES             | tmp.auth.2fa.disable.v1.json                 | Live — writes R2 |

---

## Directory Routes [Q5]

| Method | Path                                          | Manifest Status | Contract File                             | Handler Status |
|--------|-----------------------------------------------|-----------------|-------------------------------------------|----------------|
| GET    | /v1/directory/professionals                   | YES             | tmp.directory.search.v1.json              | Live (reads TMP_DIRECTORY_JSON env var; wire to D1 cache in Phase 4) |
| GET    | /v1/directory/professionals/{professional_id} | YES             | tmp.directory.professional.get.v1.json    | Live (reads TMP_DIRECTORY_JSON env var; wire to D1 cache in Phase 4) |

---

## Inquiry Routes

| Method | Path                                  | Manifest Status | Contract File                             | Handler Status |
|--------|---------------------------------------|-----------------|-------------------------------------------|----------------|
| POST   | /v1/inquiries                         | YES             | tmp.inquiry.create.v1.json                | Live — executeWritePipeline (CANONICAL format) |
| GET    | /v1/inquiries/{inquiry_id}            | YES             | tmp.inquiry.get.v1.json                   | Live — R2 read |
| GET    | /v1/inquiries/by-account/{account_id} | YES             | tmp.inquiry.list-by-account.v1.json       | Live — R2 listByField |

---

## Membership Routes

| Method | Path                                        | Manifest Status | Contract File                                    | Handler Status |
|--------|---------------------------------------------|-----------------|--------------------------------------------------|----------------|
| GET    | /v1/pricing                                 | YES             | tmp.membership.pricing.get.v1.json               | Live — reads wrangler.toml vars |
| POST   | /v1/taxpayer-memberships/free               | YES             | tmp.membership.free.create.v1.json               | Live — executeWritePipeline |
| GET    | /v1/taxpayer-memberships/{membership_id}    | YES             | tmp.membership.get.v1.json                       | Live — R2 read |
| GET    | /v1/taxpayer-memberships/by-account/{id}    | YES             | tmp.membership.list-by-account.v1.json           | Live — R2 listByField |
| PATCH  | /v1/taxpayer-memberships/{membership_id}    | YES             | tmp.membership.patch.v1.json                     | Live — R2 read+putJson |

---

## Checkout Routes

| Method | Path                     | Manifest Status | Contract File                                      | Handler Status |
|--------|--------------------------|-----------------|----------------------------------------------------|----------------|
| POST   | /v1/checkout/sessions    | YES             | tmp.membership.checkout-session.create.v1.json     | Live — calls Stripe API |
| GET    | /v1/checkout/status      | YES             | tmp.membership.checkout-status.get.v1.json         | Live — calls Stripe API |

---

## Taxpayer Account Routes

| Method | Path                              | Manifest Status | Contract File                           | Handler Status |
|--------|-----------------------------------|-----------------|-----------------------------------------|----------------|
| GET    | /v1/taxpayer-accounts/{account_id}| YES             | tmp.taxpayer-account.get.v1.json        | Live — R2 read |
| PATCH  | /v1/taxpayer-accounts/{account_id}| YES             | tmp.taxpayer-account.update.v1.json     | Live — executeWritePipeline |

---

## Notifications Routes

| Method | Path                                         | Manifest Status | Contract File                                    | Handler Status |
|--------|----------------------------------------------|-----------------|--------------------------------------------------|----------------|
| GET    | /v1/notifications/in-app                     | YES             | tmp.notifications.in-app.list.v1.json            | Live — R2 listByField |
| POST   | /v1/notifications/in-app                     | YES             | tmp.notifications.in-app.create.v1.json          | Live — R2 putJson |
| GET    | /v1/notifications/preferences/{account_id}   | YES             | tmp.notifications.preferences.get.v1.json        | Live — R2 read |
| PATCH  | /v1/notifications/preferences/{account_id}   | YES             | tmp.notifications.preferences.patch.v1.json      | Live — R2 merge |
| POST   | /v1/notifications/sms/send                   | STUB            | tmp.notifications.sms.send.v1.json               | 501 — contract file MISSING — create + wire in Phase 7 |

---

## Email Routes

| Method | Path                                     | Manifest Status | Contract File                                 | Handler Status |
|--------|------------------------------------------|-----------------|-----------------------------------------------|----------------|
| POST   | /v1/email/send                           | STUB            | tmp.email.send.v1.json                        | 501 — wire in Phase 7 |
| GET    | /v1/email/messages/{message_id}          | YES             | tmp.email.message.get.v1.json                 | Live — R2 read |
| GET    | /v1/email/messages/by-account/{id}       | YES             | tmp.email.message.list-by-account.v1.json     | Live — R2 listByField |

---

## Support Ticket Routes

| Method | Path                                      | Manifest Status | Contract File                                  | Handler Status |
|--------|-------------------------------------------|-----------------|------------------------------------------------|----------------|
| POST   | /v1/support/tickets                       | YES             | tmp.support.ticket.create.v1.json              | Live — R2 putJson |
| GET    | /v1/support/tickets/{ticket_id}           | YES             | tmp.support.ticket.get.v1.json                 | Live — R2 read |
| GET    | /v1/support/tickets/by-account/{id}       | YES             | tmp.support.ticket.list-by-account.v1.json     | Live — R2 listByField |
| PATCH  | /v1/support/tickets/{ticket_id}           | YES             | tmp.support.ticket.patch.v1.json               | Live — R2 read+putJson |

---

## Webhook Routes

| Method | Path                       | Manifest Status | Contract File                           | Handler Status |
|--------|----------------------------|-----------------|-----------------------------------------|----------------|
| POST   | /v1/webhooks/stripe        | YES             | tmp.webhooks.stripe.v1.json             | Live — verifies signature + projects to R2 |
| POST   | /v1/webhooks/twilio        | YES             | tmp.webhooks.twilio.v1.json             | Live — appends receipt |
| POST   | /v1/webhooks/google-email  | YES             | tmp.webhooks.google-email.v1.json       | Live — appends receipt |

---

## Routes Planned for Future Phases (NOT yet in manifest.js)

### Cal.com Routes — Phase 5 [Q1] [Q2]
| Method | Path                              | Status   | Contract File (to be created)                |
|--------|-----------------------------------|----------|----------------------------------------------|
| GET    | /v1/cal/app/oauth/start           | PLANNED  | tmp.cal.app.oauth.start.v1.json              |
| GET    | /v1/cal/app/oauth/callback        | PLANNED  | tmp.cal.app.oauth.callback.v1.json           |
| GET    | /v1/cal/pro/oauth/start           | PLANNED  | tmp.cal.pro.oauth.start.v1.json              |
| GET    | /v1/cal/pro/oauth/callback        | PLANNED  | tmp.cal.pro.oauth.callback.v1.json           |
| GET    | /v1/cal/bookings                  | PLANNED  | tmp.cal.bookings.list.v1.json                |
| POST   | /v1/cal/bookings                  | PLANNED  | tmp.cal.bookings.create.v1.json              |
| GET    | /v1/cal/profile                   | PLANNED  | tmp.cal.profile.get.v1.json                  |

### VLP Directory Webhook — Phase 4 [Q5]
| Method | Path                           | Status   | Contract File (to be created)                |
|--------|--------------------------------|----------|----------------------------------------------|
| POST   | /v1/webhooks/vlp-directory     | PLANNED  | tmp.webhooks.vlp-directory.v1.json           |

### Post-Payment + Exit Survey — Phase 9 [Q4]
| Method | Path                                      | Status   | Contract File (to be created)                              |
|--------|-------------------------------------------|----------|------------------------------------------------------------|
| POST   | /v1/exit-survey                           | PLANNED  | tmp.exit-survey.submit.v1.json                             |
| PATCH  | /v1/taxpayer-accounts/{id}/filing-status  | PLANNED  | tmp.taxpayer-account.filing-status.update.v1.json          |

### Document Storage — Phase 11 [Q6]
| Method | Path                                   | Status   | Contract File (to be created)                        |
|--------|----------------------------------------|----------|------------------------------------------------------|
| POST   | /v1/documents/upload/init              | PLANNED  | tmp.document.upload-init.v1.json                     |
| POST   | /v1/documents/upload/complete          | PLANNED  | tmp.document.upload-complete.v1.json                 |
| GET    | /v1/documents/{document_id}            | PLANNED  | tmp.document.get.v1.json                             |
| GET    | /v1/documents/by-account/{account_id}  | PLANNED  | tmp.document.list-by-account.v1.json                 |
| POST   | /v1/documents/photo/upload/init        | PLANNED  | tmp.document.photo-upload-init.v1.json               |
| POST   | /v1/documents/photo/upload/complete    | PLANNED  | tmp.document.photo-upload-complete.v1.json           |

### Compliance Reports — Phase 12
| Method | Path                                           | Status   | Contract File (to be created)                               |
|--------|------------------------------------------------|----------|-------------------------------------------------------------|
| POST   | /v1/compliance-reports                         | PLANNED  | tmp.compliance-report.create.v1.json                        |
| GET    | /v1/compliance-reports/{report_id}             | PLANNED  | tmp.compliance-report.get.v1.json                           |
| GET    | /v1/compliance-reports/by-account/{id}         | PLANNED  | tmp.compliance-report.list-by-account.v1.json               |
| GET    | /v1/compliance-reports/by-professional/{id}    | PLANNED  | tmp.compliance-report.list-by-professional.v1.json          |

### POA + Transcript Upload — Phase 13
NOTE: POST /v1/transcripts/request is REMOVED (TTMP handoff model — incorrect).
Replaced by upload-init and upload-complete. Tax pro uploads directly to TMP via presigned R2 URL. [Q11]

| Method | Path                                     | Status   | Contract File (to be created)                    |
|--------|------------------------------------------|----------|--------------------------------------------------|
| POST   | /v1/poa                                  | PLANNED  | tmp.poa.submit.v1.json                           |
| GET    | /v1/poa/{poa_id}                         | PLANNED  | tmp.poa.get.v1.json                              |
| GET    | /v1/poa/by-account/{account_id}          | PLANNED  | tmp.poa.list-by-account.v1.json                  |
| POST   | /v1/transcripts/upload/init              | PLANNED  | tmp.transcript.upload-init.v1.json               |
| POST   | /v1/transcripts/upload/complete          | PLANNED  | tmp.transcript.upload-complete.v1.json           |

### Engagement Management Routes — Phase 15 [Q8]
| Method | Path                                         | Status   | Contract File (to be created)                |
|--------|----------------------------------------------|----------|----------------------------------------------|
| GET    | /v1/engagements/open                         | PLANNED  | tmp.engagement.list-open.v1.json             |
| POST   | /v1/engagements/{engagement_id}/claim        | PLANNED  | tmp.engagement.claim.v1.json                 |

### Entitlements Routes — Phase 2/9
| Method | Path                              | Status  | Contract File                          |
|--------|-----------------------------------|---------|----------------------------------------|
| GET    | /v1/entitlements/{account_id}     | PLANNED | tmp.entitlements.get.v1.json           |
| PATCH  | /v1/entitlements/{account_id}     | PLANNED | tmp.entitlements.patch.v1.json         |

---

## Route Count Summary

| Category                              | Count |
|---------------------------------------|-------|
| In manifest (total)                   | 45    |
| In manifest with contract             | 44    |
| In manifest without contract          | 1     |
| MISSING contract files                | 1     |
| STUB handlers (501)                   | 11    |
| Live handlers                         | 33    |
| Planned (not in manifest)             | 28    |
| **Total surface (current + planned)** | **73**|

NOTE: Planned count increased from 22 (original) due to:
  +2  Monitoring engagement checkout routes (Phase 9 correction)
  +2  Transcript upload routes replacing removed transcript.request (Phase 13 correction)
  +2  Engagement management routes (Phase 15, Q8)
  -1  Removed: POST /v1/transcripts/request (TTMP handoff model — incorrect)
  Net: +5 from original ROUTES.md baseline of 22 planned

---

## Critical Gaps

1. `tmp.notifications.sms.send.v1.json` — CONTRACT FILE MISSING
   Route is in manifest. Handler is stub (501). Fix in Phase 7.

2. No `/v1/webhooks/vlp-directory` — ROUTE NOT IN MANIFEST
   Required for directory sync. Add in Phase 4. [Q5]

3. No Cal.com routes — ALL PLANNED
   Phase 5 adds 7 new routes + 7 new contracts. [Q1]

4. D1 projections are disabled — all projection steps return { ok: true, skipped: true }
   Phase 1 adds D1 binding. Phase 2 creates schema. Phase 3+ wires projections.

5. Auth is not real — GET /v1/auth/session reads a header, not a signed cookie
   Phase 3 wires real session management with tmp_session HttpOnly cookie.

6. Directory is seeded from env var — GET /v1/directory/professionals reads
   TMP_DIRECTORY_JSON (which is not set in wrangler.toml)
   Phase 4 wires to vlp_professionals_cache D1 table populated by VLP webhook.

7. Cron Trigger not yet in wrangler.toml — add [triggers] crons = ["0 9 * * *"] in Phase 9.
   Without this, monitoring engagements are never automatically marked complete. [Q9]

8. Snapshot plan_end has no setter until Phase 12 — POST /v1/compliance-reports handler
   must set plan_end on the engagement when the second report is delivered for that
   engagement_id. Snapshot engagements remain open indefinitely until Phase 12 ships. [Q9]
