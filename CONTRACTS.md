# TMP Contract Coverage
# Platform: Tax Monitor Pro (TMP)
# All canonical Worker contracts live in /contracts/ as tmp.*.v1.json
# Last updated: 2026-03-18 (corrections applied — monitoring engagement model)
# Total contracts: 75
#   On disk (tmp.*.v1.json):  43
#   Missing from disk:         1 (referenced in manifest, file absent)
#   Planned (not yet created): 31
#
# CORRECTION APPLIED: tmp.transcript.request.v1.json (TTMP handoff model) is REMOVED.
# Four new contracts replace it. See Phase 9 and Phase 13 sections below.

---

## CONTRACT FORMATS

Two formats exist. Legacy contracts must be upgraded to canonical before their
D1 projections can run. Upgrade happens in the phase that implements the route.

**CANONICAL** — 7 required keys:
  auth, contract, delivery, effects, payload, response, schema

**LEGACY** — stub format with empty fields:
  Keys: contract_version, domain, notes, request, response, storage

---

## NAMING CONVENTION

  tmp.{domain}.{action}.v1.json
  Examples: tmp.inquiry.create.v1.json, tmp.auth.google.start.v1.json

Contracts NOT permitted (VLP-governed records — TMP must not own these):
  billing_customers, billing_invoices, billing_payment_intents,
  billing_payment_methods, billing_setup_intents, billing_subscriptions,
  professional profiles, VLP account records, VLP token ledger entries

---

## SECTION 1 — AUTH CONTRACTS (15 on disk)

| # | File                                        | Route                              | Method | Format    | Phase | Handler  |
|---|---------------------------------------------|------------------------------------|--------|-----------|-------|----------|
| 1 | tmp.auth.session.get.v1.json                | /v1/auth/session                   | GET    | LEGACY    | 3     | Live (stub real auth) |
| 2 | tmp.auth.logout.v1.json                     | /v1/auth/logout                    | POST   | LEGACY    | 3     | Live (stub cookie clear) |
| 3 | tmp.auth.google.start.v1.json               | /v1/auth/google/start              | GET    | LEGACY    | 3     | 501 — wire Phase 3 |
| 4 | tmp.auth.google.callback.v1.json            | /v1/auth/google/callback           | GET    | LEGACY    | 3     | 501 — wire Phase 3 |
| 5 | tmp.auth.magic-link.request.v1.json         | /v1/auth/magic-link/request        | POST   | LEGACY    | 3     | 501 — wire Phase 3 |
| 6 | tmp.auth.magic-link.verify.v1.json          | /v1/auth/magic-link/verify         | GET    | LEGACY    | 3     | 501 — wire Phase 3 |
| 7 | tmp.auth.sso.oidc.start.v1.json             | /v1/auth/sso/oidc/start            | GET    | LEGACY    | 3     | 501 — wire Phase 3 [Q7] |
| 8 | tmp.auth.sso.oidc.callback.v1.json          | /v1/auth/sso/oidc/callback         | GET    | LEGACY    | 3     | 501 — wire Phase 3 [Q7] |
| 9 | tmp.auth.sso.saml.start.v1.json             | /v1/auth/sso/saml/start            | GET    | LEGACY    | 3     | 501 — wire Phase 3 [Q7] |
|10 | tmp.auth.sso.saml.acs.v1.json               | /v1/auth/sso/saml/acs              | POST   | LEGACY    | 3     | 501 — wire Phase 3 [Q7] |
|11 | tmp.auth.2fa.status.get.v1.json             | /v1/auth/2fa/status/{account_id}   | GET    | LEGACY    | 3     | Live — R2 read |
|12 | tmp.auth.2fa.enroll-init.v1.json            | /v1/auth/2fa/enroll/init           | POST   | LEGACY    | 3     | Live — R2 write |
|13 | tmp.auth.2fa.enroll-verify.v1.json          | /v1/auth/2fa/enroll/verify         | POST   | LEGACY    | 3     | Live — R2 write |
|14 | tmp.auth.2fa.challenge-verify.v1.json       | /v1/auth/2fa/challenge/verify      | POST   | LEGACY    | 14    | 501 — needs TOTP provider |
|15 | tmp.auth.2fa.disable.v1.json                | /v1/auth/2fa/disable               | POST   | LEGACY    | 3     | Live — R2 write |

---

## SECTION 2 — DIRECTORY CONTRACTS (2 on disk)

| # | File                                        | Route                                              | Method | Format    | Phase | Handler  |
|---|---------------------------------------------|----------------------------------------------------|--------|-----------|-------|----------|
|16 | tmp.directory.search.v1.json                | /v1/directory/professionals                        | GET    | LEGACY    | 4     | Live (env var stub; wire D1 cache Phase 4) [Q5] |
|17 | tmp.directory.professional.get.v1.json      | /v1/directory/professionals/{professional_id}      | GET    | LEGACY    | 4     | Live (env var stub; wire D1 cache Phase 4) [Q5] |

---

## SECTION 3 — INQUIRY CONTRACTS (3 on disk)

| # | File                                        | Route                                     | Method | Format    | Phase | Handler  |
|---|---------------------------------------------|-------------------------------------------|--------|-----------|-------|----------|
|18 | tmp.inquiry.create.v1.json                  | /v1/inquiries                             | POST   | CANONICAL | 0     | Live — executeWritePipeline |
|19 | tmp.inquiry.get.v1.json                     | /v1/inquiries/{inquiry_id}                | GET    | LEGACY    | 0     | Live — R2 read |
|20 | tmp.inquiry.list-by-account.v1.json         | /v1/inquiries/by-account/{account_id}     | GET    | LEGACY    | 0     | Live — R2 listByField |

---

## SECTION 4 — MEMBERSHIP CONTRACTS (7 on disk)

| # | File                                              | Route                                          | Method | Format    | Phase | Handler  |
|---|---------------------------------------------------|------------------------------------------------|--------|-----------|-------|----------|
|21 | tmp.membership.pricing.get.v1.json                | /v1/pricing                                    | GET    | LEGACY    | 0     | Live — reads wrangler.toml vars |
|22 | tmp.membership.free.create.v1.json                | /v1/taxpayer-memberships/free                  | POST   | CANONICAL | 0     | Live — executeWritePipeline |
|23 | tmp.membership.get.v1.json                        | /v1/taxpayer-memberships/{membership_id}       | GET    | LEGACY    | 0     | Live — R2 read |
|24 | tmp.membership.list-by-account.v1.json            | /v1/taxpayer-memberships/by-account/{id}       | GET    | LEGACY    | 0     | Live — R2 listByField |
|25 | tmp.membership.patch.v1.json                      | /v1/taxpayer-memberships/{membership_id}       | PATCH  | LEGACY    | 0     | Live — R2 read + putJson |
|26 | tmp.membership.checkout-session.create.v1.json    | /v1/checkout/sessions                          | POST   | LEGACY    | 9     | Live — calls Stripe API |
|27 | tmp.membership.checkout-status.get.v1.json        | /v1/checkout/status                            | GET    | LEGACY    | 9     | Live — calls Stripe API |

NOTE: Contracts #26 and #27 govern platform membership checkout ONLY.
Separate monitoring-plan contracts (#62 and #63) govern monitoring engagement checkout.
Both checkout flows share the POST /v1/checkout/sessions and GET /v1/checkout/status
endpoints; the Stripe webhook routes them based on price metadata product_type field.

---

## SECTION 5 — TAXPAYER ACCOUNT CONTRACTS (2 on disk)

| # | File                                        | Route                                      | Method | Format    | Phase | Handler  |
|---|---------------------------------------------|--------------------------------------------|--------|-----------|-------|----------|
|28 | tmp.taxpayer-account.get.v1.json            | /v1/taxpayer-accounts/{account_id}         | GET    | LEGACY    | 0     | Live — R2 read |
|29 | tmp.taxpayer-account.update.v1.json         | /v1/taxpayer-accounts/{account_id}         | PATCH  | CANONICAL | 0     | Live — executeWritePipeline |

---

## SECTION 6 — NOTIFICATIONS CONTRACTS (4 on disk, 1 missing)

| # | File                                              | Route                                              | Method | Format    | Phase | Handler  |
|---|---------------------------------------------------|----------------------------------------------------|--------|-----------|-------|----------|
|30 | tmp.notifications.in-app.list.v1.json             | /v1/notifications/in-app                           | GET    | LEGACY    | 0     | Live — R2 listByField |
|31 | tmp.notifications.in-app.create.v1.json           | /v1/notifications/in-app                           | POST   | LEGACY    | 0     | Live — R2 putJson |
|32 | tmp.notifications.preferences.get.v1.json         | /v1/notifications/preferences/{account_id}         | GET    | LEGACY    | 0     | Live — R2 read |
|33 | tmp.notifications.preferences.patch.v1.json       | /v1/notifications/preferences/{account_id}         | PATCH  | LEGACY    | 0     | Live — R2 merge |
|34 | tmp.notifications.sms.send.v1.json                | /v1/notifications/sms/send                         | POST   | MISSING   | 7     | 501 — CREATE FILE + wire Phase 7 |

CONTRACT #34 IS MISSING FROM DISK. Route is in manifest.js. Handler is stub (501).
Fix in Phase 7: create file + wire to Twilio API.

---

## SECTION 7 — EMAIL CONTRACTS (3 on disk)

| # | File                                              | Route                                           | Method | Format    | Phase | Handler  |
|---|---------------------------------------------------|-------------------------------------------------|--------|-----------|-------|----------|
|35 | tmp.email.send.v1.json                            | /v1/email/send                                  | POST   | LEGACY    | 7     | 501 — wire Phase 7 |
|36 | tmp.email.message.get.v1.json                     | /v1/email/messages/{message_id}                 | GET    | LEGACY    | 0     | Live — R2 read |
|37 | tmp.email.message.list-by-account.v1.json         | /v1/email/messages/by-account/{account_id}      | GET    | LEGACY    | 0     | Live — R2 listByField |

---

## SECTION 8 — SUPPORT TICKET CONTRACTS (4 on disk)

| # | File                                              | Route                                          | Method | Format    | Phase | Handler  |
|---|---------------------------------------------------|------------------------------------------------|--------|-----------|-------|----------|
|38 | tmp.support.ticket.create.v1.json                 | /v1/support/tickets                            | POST   | LEGACY    | 0     | Live — R2 putJson |
|39 | tmp.support.ticket.get.v1.json                    | /v1/support/tickets/{ticket_id}                | GET    | LEGACY    | 0     | Live — R2 read |
|40 | tmp.support.ticket.list-by-account.v1.json        | /v1/support/tickets/by-account/{account_id}    | GET    | LEGACY    | 0     | Live — R2 listByField |
|41 | tmp.support.ticket.patch.v1.json                  | /v1/support/tickets/{ticket_id}                | PATCH  | LEGACY    | 0     | Live — R2 read + putJson |

---

## SECTION 9 — WEBHOOK CONTRACTS (3 on disk)

| # | File                                        | Route                          | Method | Format    | Phase | Handler  |
|---|---------------------------------------------|--------------------------------|--------|-----------|-------|----------|
|42 | tmp.webhooks.stripe.v1.json                 | /v1/webhooks/stripe            | POST   | LEGACY    | 9     | Live — verifies signature + projects to R2. Phase 9 adds monitoring-engagement routing. |
|43 | tmp.webhooks.twilio.v1.json                 | /v1/webhooks/twilio            | POST   | LEGACY    | 7     | Live — appends receipt |
|44 | tmp.webhooks.google-email.v1.json           | /v1/webhooks/google-email      | POST   | LEGACY    | 7     | Live — appends receipt |

---

## SECTION 10 — PLANNED CONTRACTS: CAL.COM — Phase 5 [Q1] [Q2]

These contracts do not exist yet. Create + wire in Phase 5.

| # | File (to create)                                  | Route                              | Method | Notes |
|---|---------------------------------------------------|------------------------------------|--------|-------|
|45 | tmp.cal.app.oauth.start.v1.json                   | /v1/cal/app/oauth/start            | GET    | Taxpayer Cal.com OAuth initiation [Q1] |
|46 | tmp.cal.app.oauth.callback.v1.json                | /v1/cal/app/oauth/callback         | GET    | Taxpayer Cal.com OAuth callback [Q1] |
|47 | tmp.cal.pro.oauth.start.v1.json                   | /v1/cal/pro/oauth/start            | GET    | Tax pro Cal.com OAuth initiation [Q1] |
|48 | tmp.cal.pro.oauth.callback.v1.json                | /v1/cal/pro/oauth/callback         | GET    | Tax pro Cal.com OAuth callback [Q1] |
|49 | tmp.cal.bookings.list.v1.json                     | /v1/cal/bookings                   | GET    | List bookings for account [Q2] |
|50 | tmp.cal.bookings.create.v1.json                   | /v1/cal/bookings                   | POST   | Create booking [Q2] |
|51 | tmp.cal.profile.get.v1.json                       | /v1/cal/profile                    | GET    | Get Cal.com profile for account |

All Cal.com OAuth tokens must be encrypted at rest in D1 tmp_cal_tokens (AES-256-GCM). [Q1]

---

## SECTION 11 — PLANNED CONTRACTS: VLP DIRECTORY WEBHOOK — Phase 4 [Q5]

| # | File (to create)                                  | Route                          | Method | Notes |
|---|---------------------------------------------------|--------------------------------|--------|-------|
|52 | tmp.webhooks.vlp-directory.v1.json                | /v1/webhooks/vlp-directory     | POST   | VLP → TMP directory sync. Signed with VLP_WEBHOOK_SECRET. Projects to vlp_professionals_cache D1. [Q5] |

---

## SECTION 12 — PLANNED CONTRACTS: MESSAGING — Phase 7

| # | File (to create or fix)                           | Route                          | Method | Notes |
|---|---------------------------------------------------|--------------------------------|--------|-------|
|34*| tmp.notifications.sms.send.v1.json                | /v1/notifications/sms/send     | POST   | Already in manifest. File MISSING. Create in Phase 7. |

*#34 is the same as the MISSING entry above. Listed here for phase planning.

---

## SECTION 13 — PLANNED CONTRACTS: POST-PAYMENT + EXIT SURVEY — Phase 9 [Q4]

| # | File (to create)                                        | Route                                              | Method | Notes |
|---|------------------------------------------------------|----------------------------------------------------|--------|-------|
|53 | tmp.exit-survey.submit.v1.json                          | /v1/exit-survey                                    | POST   | Cancellation exit survey [Q4] |
|54 | tmp.taxpayer-account.filing-status.update.v1.json       | /v1/taxpayer-accounts/{id}/filing-status           | PATCH  | Updates filing status post-payment |

---

## SECTION 14 — PLANNED CONTRACTS: MONITORING ENGAGEMENT CHECKOUT — Phase 9

CORRECTION: These are NEW contracts not in the original plan.
Govern the separate Tax Monitoring Engagement product line (Bronze/Silver/Gold/Snapshot).
Completely separate from platform membership checkout.

| # | File (to create)                                              | Route                         | Method | Notes |
|---|---------------------------------------------------------------|-------------------------------|--------|-------|
|62 | tmp.monitoring-plan.checkout-session.create.v1.json           | /v1/checkout/sessions         | POST   | Creates Stripe checkout for monitoring plan. Price metadata: product_type = "monitoring_engagement". |
|63 | tmp.monitoring-plan.checkout-status.get.v1.json               | /v1/checkout/status           | GET    | Polls Stripe checkout status for monitoring plan session. |

The Stripe webhook (contract #42) must detect product_type in price metadata and route:
  product_type = "monitoring_engagement" → write to tmp_monitoring_engagements
  product_type = "membership"            → write to tmp_memberships (existing behavior)

D1 migration 0017_create_tmp_monitoring_engagements.sql added in Phase 9.

NOTE — Snapshot plan_end [Q9]:
  Snapshot engagements are created with plan_end = null at checkout.
  plan_end is set by Phase 12 (POST /v1/compliance-reports) when the second report
  is delivered for the engagement_id.
  The Phase 9 Cron Trigger only picks up engagements where plan_end IS NOT NULL
  AND plan_end <= today. Snapshot engagements with no second report are never completed
  by the Cron until the Phase 12 handler sets plan_end.

---

## SECTION 15 — PLANNED CONTRACTS: DOCUMENT STORAGE — Phase 11 [Q6]

| # | File (to create)                                        | Route                                          | Method | Notes |
|---|----------------------------------------------------------|-------------------------------------------------|--------|-------|
|55 | tmp.document.upload-init.v1.json                         | /v1/documents/upload/init                      | POST   | Initiate document upload — returns scoped R2 upload path |
|56 | tmp.document.upload-complete.v1.json                     | /v1/documents/upload/complete                  | POST   | Confirm upload — writes metadata to D1, writes audit event |
|57 | tmp.document.get.v1.json                                 | /v1/documents/{document_id}                    | GET    | Get document metadata (never returns raw content) |
|58 | tmp.document.list-by-account.v1.json                     | /v1/documents/by-account/{account_id}          | GET    | List documents for account |
|59 | tmp.document.photo-upload-init.v1.json                   | /v1/documents/photo/upload/init                | POST   | Initiate profile photo upload |
|60 | tmp.document.photo-upload-complete.v1.json               | /v1/documents/photo/upload/complete            | POST   | Confirm profile photo upload |

Document content NEVER stored in D1. Metadata only in D1 tmp_documents.
Content stored encrypted at /r2/tmp_documents/{account_id}/{document_id}.enc [Q6]
Phase 11 must deploy before Phase 12 (compliance reports) can go live. Rule #10.

---

## SECTION 16 — PLANNED CONTRACTS: COMPLIANCE REPORTS — Phase 12

| # | File (to create)                                             | Route                                                  | Method | Notes |
|---|---------------------------------------------------------------|--------------------------------------------------------|--------|-------|
|64 | tmp.compliance-report.create.v1.json                          | /v1/compliance-reports                                 | POST   | Tax pro creates compliance report for taxpayer account |
|65 | tmp.compliance-report.get.v1.json                             | /v1/compliance-reports/{report_id}                     | GET    | Get compliance report (encrypted content served from R2) |
|66 | tmp.compliance-report.list-by-account.v1.json                 | /v1/compliance-reports/by-account/{account_id}         | GET    | List compliance reports for taxpayer |
|67 | tmp.compliance-report.list-by-professional.v1.json            | /v1/compliance-reports/by-professional/{professional_id}| GET   | List compliance reports created by tax pro |

Depends on Phase 11 (document storage controls must exist first).

---

## SECTION 17 — PLANNED CONTRACTS: POA + TRANSCRIPT UPLOAD — Phase 13

CORRECTION: tmp.transcript.request.v1.json is REMOVED (TTMP handoff model was incorrect).
Replaced by tmp.transcript.upload-init.v1.json and tmp.transcript.upload-complete.v1.json.
No JWT handoff token. No TTMP redirect. Tax pro uploads manually into TMP.

| # | File (to create)                                        | Route                                      | Method | Notes |
|---|---------------------------------------------------------|--------------------------------------------|--------|-------|
|68 | tmp.poa.submit.v1.json                                  | /v1/poa                                    | POST   | Taxpayer submits Form 2848 POA (eSign or wet-signed via Phase 11 upload) |
|69 | tmp.poa.get.v1.json                                     | /v1/poa/{poa_id}                           | GET    | Get POA record. cafNumber NEVER returned in response. |
|70 | tmp.poa.list-by-account.v1.json                         | /v1/poa/by-account/{account_id}            | GET    | List POA records for account |
|71 | tmp.transcript.upload-init.v1.json                      | /v1/transcripts/upload/init                | POST   | Tax pro initiates transcript upload for a taxpayer. Requires active engagement record + 2848 on file. Worker validates pro-to-taxpayer engagement link. |
|72 | tmp.transcript.upload-complete.v1.json                  | /v1/transcripts/upload/complete            | POST   | Confirms upload. Writes metadata to D1. Writes audit event to tmp_activity. |

CAF number: encrypted in R2 (AES-256-GCM). Never stored in D1. Never in API responses.
Transcript file: stored at /r2/tmp_transcripts/{account_id}/{document_id}.enc (encrypted).
Depends on Phase 11 (document storage) + Phase 9 (engagement record must exist).

REMOVED CONTRACT (do not create):
  ~~tmp.transcript.request.v1.json~~ — INCORRECT MODEL. TTMP handoff never existed. Do not implement.

---

## SECTION 18 — PLANNED CONTRACTS: ENGAGEMENT MANAGEMENT — Phase 15 [Q8]

Tax pro self-claim model. DECISION CLOSED [Q8].
Any verified taxpro (role: 'taxpro', status: 'active') can claim any open engagement.
No specialty matching. No location constraint. Race condition handled via conditional D1 update.

| # | File (to create)                         | Route                                         | Method | Notes |
|---|------------------------------------------|-----------------------------------------------|--------|-------|
|73 | tmp.engagement.claim.v1.json             | /v1/engagements/{engagement_id}/claim         | POST   | Tax pro claims open engagement. Requires role: 'taxpro', status: 'active'. Engagement must have status: 'pending' and professional_id: null. Returns 409 Conflict if already claimed. Writes audit event. [Q8] |
|74 | tmp.engagement.list-open.v1.json         | /v1/engagements/open                          | GET    | Lists all engagements with status: 'pending' and professional_id: null. Taxpro-only. Reads from D1 tmp_monitoring_engagements. [Q8] |

Both contracts depend on Phase 9 (tmp_monitoring_engagements D1 table must exist).

---

## SECTION 19 — ENTITLEMENTS CONTRACTS — Phase 2/9

| # | File | Route | Method | Manifest | D1 table | HTML source | Phase | Format |
|---|------|-------|--------|----------|----------|-------------|-------|--------|
| 75 | tmp.entitlements.get.v1.json | /v1/entitlements/{account_id} | GET | PLANNED | tmp_entitlements | app/index.html | 2 | CANONICAL |
| 76 | tmp.entitlements.patch.v1.json | /v1/entitlements/{account_id} | PATCH | PLANNED | tmp_entitlements | NONE (system-initiated) | 9 | CANONICAL |

GET /v1/entitlements/{account_id} — Phase 2 (returns plan defaults from wrangler.toml when no R2 record exists).
PATCH /v1/entitlements/{account_id} — Phase 9 (wired to billing cycle: grant on activation, decrement on use, reset on renewal).
Stripe webhook entitlement grants — Phase 9 (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted).

---

## CONTRACT COUNT SUMMARY

| Category                                     | Count |
|----------------------------------------------|-------|
| On disk (tmp.*.v1.json)                       | 43    |
| Missing from disk (manifest reference)        | 1     |
| Planned — Cal.com (Phase 5)                   | 7     |
| Planned — VLP webhook (Phase 4)               | 1     |
| Planned — Messaging (Phase 7)                 | 0*    |
| Planned — Post-payment (Phase 9)              | 2     |
| Planned — Monitoring checkout (Phase 9)       | 2     |
| Planned — Documents (Phase 11)                | 6     |
| Planned — Compliance reports (Phase 12)       | 4     |
| Planned — POA + Transcript (Phase 13)         | 5     |
| Planned — Engagement management (Phase 15)    | 2     |
| Planned — Entitlements (Phase 2/9)            | 2     |
| **TOTAL**                                     | **75**|

*The SMS send contract (#34) is counted in "Missing from disk" — it was referenced but never created.

---

## UPGRADE QUEUE (Legacy → Canonical, grouped by phase)

Legacy contracts must be upgraded to canonical format before their D1 projections run.
Upgrade happens in the phase that implements the route.

**Phase 3 — Auth:**
  tmp.auth.session.get.v1.json          (real session, D1 projection to tmp_taxpayer_accounts)
  tmp.auth.logout.v1.json               (real cookie clear)
  tmp.auth.google.start.v1.json         (no D1 write — redirect only)
  tmp.auth.google.callback.v1.json      (account upsert → tmp_taxpayer_accounts)
  tmp.auth.magic-link.request.v1.json   (writes to tmp_magic_link_tokens)
  tmp.auth.magic-link.verify.v1.json    (clears token, starts session)
  tmp.auth.sso.oidc.start.v1.json       (no D1 write — redirect only)
  tmp.auth.sso.oidc.callback.v1.json    (account upsert → tmp_taxpayer_accounts)
  tmp.auth.sso.saml.start.v1.json       (no D1 write — redirect only)
  tmp.auth.sso.saml.acs.v1.json         (account upsert → tmp_taxpayer_accounts)
  tmp.auth.2fa.enroll-init.v1.json      (writes pending TOTP to R2)
  tmp.auth.2fa.enroll-verify.v1.json    (activates TOTP, writes to R2)
  tmp.auth.2fa.disable.v1.json          (clears TOTP from R2)

**Phase 4 — Directory:**
  tmp.directory.search.v1.json          (wires to vlp_professionals_cache D1)
  tmp.directory.professional.get.v1.json(wires to vlp_professionals_cache D1)

**Phase 5 — Cal.com:**
  All Cal.com contracts created as canonical (new files)

**Phase 7 — Messaging:**
  tmp.email.send.v1.json                (wires Gmail API, writes to tmp_email_messages)
  tmp.notifications.sms.send.v1.json    (create file + wire Twilio)
  tmp.webhooks.twilio.v1.json           (upgrade to canonical with D1 projection)
  tmp.webhooks.google-email.v1.json     (upgrade to canonical with D1 projection)

**Phase 9 — Billing + Monitoring:**
  tmp.membership.checkout-session.create.v1.json   (upgrade + add monitoring-plan routing)
  tmp.membership.checkout-status.get.v1.json        (upgrade)
  tmp.webhooks.stripe.v1.json                       (upgrade + add monitoring engagement routing)
  tmp.membership.patch.v1.json                      (upgrade with D1 projection)
  tmp.membership.get.v1.json                        (upgrade)
  tmp.membership.list-by-account.v1.json            (upgrade)
  tmp.membership.free.create.v1.json                (already CANONICAL — add D1 projection step)

**Phase 14 — 2FA Challenge:**
  tmp.auth.2fa.challenge-verify.v1.json             (upgrade + wire TOTP provider)
