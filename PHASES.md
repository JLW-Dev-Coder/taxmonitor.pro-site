# TMP Migration Phase Plan
# Platform: Tax Monitor Pro (TMP)
# Last updated: 2026-03-18 (corrections applied — monitoring engagement model)
# Total phases: 0–16 (17 phases including Phase 0 baseline)
# Status: Phases 0–16 LOCKED
#
# CORRECTION APPLIED:
#   Phase 13 — JWT handoff token and TTMP redirect REMOVED.
#   Phase 13 now implements tax pro transcript upload model.
#   Phase 9 now includes monitoring engagement checkout (second Stripe product line).
#
# PHASE DEPENDENCIES:
#   Phase 11 (documents) must deploy before Phase 12 (compliance reports)
#   Phase 11 + Phase 9 must deploy before Phase 13 (transcript upload needs both)
#   Phase 3 (real auth) must deploy before Phase 5 (Cal.com OAuth needs real sessions)

---

## PHASE DEPENDENCY GRAPH

```
Phase 0 (Baseline)
  └── Phase 1 (D1 Binding + Validation)
        └── Phase 2 (D1 Schema)
              └── Phase 3 (Auth)
                    ├── Phase 4 (VLP Directory Sync)
                    │     └── Phase 5 (Cal.com) [Q1]
                    │           └── Phase 6 (Intake Sessions)
                    ├── Phase 7 (Messaging)
                    ├── Phase 8 (Search + Filtering)
                    ├── Phase 9 (Billing + Monitoring Checkout)
                    │     └── Phase 10 (Token Redemption)
                    │     └── Phase 11 (Document Storage) [Q6]
                    │           └── Phase 12 (Compliance Reports)
                    │           └── Phase 13 (POA + Transcript Upload)
                    ├── Phase 14 (2FA Challenge)
                    └── Phase 15 (Tax Pro Routes)
                          └── Phase 16 (Tax Pro Dashboard + VLP Sync)
```

---

## PHASE 0 — Baseline (COMPLETE)

**Status:** Live
**Goal:** Establish working R2 read/write and core routing foundation

**What is live:**
  - R2 read/write: getJson, putJson, listByField, listByPrefix
  - executeWritePipeline (receipt + canonical upsert — D1 step returns skipped)
  - GET /health → 200
  - GET /v1/taxpayer-accounts/{id} → R2 read
  - PATCH /v1/taxpayer-accounts/{id} → executeWritePipeline (CANONICAL contract)
  - GET /v1/inquiries/{id} → R2 read
  - GET /v1/inquiries/by-account/{id} → R2 listByField
  - POST /v1/inquiries → executeWritePipeline (CANONICAL contract)
  - GET /v1/taxpayer-memberships/{id} → R2 read
  - GET /v1/taxpayer-memberships/by-account/{id} → R2 listByField
  - POST /v1/taxpayer-memberships/free → executeWritePipeline (CANONICAL contract)
  - PATCH /v1/taxpayer-memberships/{id} → R2 read + putJson
  - GET /v1/pricing → reads wrangler.toml vars
  - GET /v1/checkout/status → Stripe API proxy
  - POST /v1/checkout/sessions → creates Stripe Checkout Session
  - POST /v1/webhooks/stripe → verifies signature + projects membership to R2
  - POST /v1/webhooks/google-email → appends receipt
  - POST /v1/webhooks/twilio → appends receipt
  - GET /v1/auth/session → reads x-account-id header (stub — no real session)
  - POST /v1/auth/logout → returns loggedOut: true (stub cookie clear)
  - GET /v1/auth/2fa/status/{id}, POST /v1/auth/2fa/enroll/init,
    POST /v1/auth/2fa/enroll/verify, POST /v1/auth/2fa/disable → R2 read/write
  - GET/PATCH /v1/notifications/preferences/{id} → R2
  - GET/POST /v1/notifications/in-app → R2
  - POST/GET/PATCH /v1/support/tickets* → R2
  - GET /v1/directory/professionals → TMP_DIRECTORY_JSON env var (stub)
  - GET /v1/email/messages/* → R2

**What returns 501 (stubs):**
  - Auth: google/*, magic-link/*, sso/*, 2fa/challenge/verify
  - POST /v1/email/send
  - POST /v1/notifications/sms/send (contract file also MISSING)

**Known gaps to fix in subsequent phases:**
  - D1 binding absent from wrangler.toml (Phase 1)
  - TMP_DIRECTORY_JSON var absent from wrangler.toml (Phase 1)
  - VLP_API_BASE_URL var absent (Phase 4)
  - Both Cal.com redirect URIs missing /v1/ prefix (Phase 5)
  - Both Cal.com client IDs are the same placeholder value (Phase 5)
  - tmp.notifications.sms.send.v1.json contract file missing (Phase 7)

---

## PHASE 1 — Foundation

**Goal:** Wire D1 binding, add contract validation, establish local dev seed variables

**Deliverables:**
  1. Add [[d1_databases]] block to wrangler.toml:
       binding = "DB"
       database_name = "taxmonitor-pro-d1"
       database_id = "{id from wrangler d1 create}"
  2. Create workers/src/validate.js — contract validation module
       - Loads contract from R2 or bundled JSON
       - Validates method, path, auth, payload against contract schema
       - Returns 400/401/403 on validation failure (deny by default)
  3. Add TMP_DIRECTORY_JSON = "" to wrangler.toml [vars] (empty string for local dev seed)
  4. Wire contract validation into the request pipeline (all routes)
  5. executeWritePipeline D1 projection step remains { ok: true, skipped: true }
     until Phase 2 schema exists

**Contracts changed:** None (no new routes)
**Migrations:** None (no schema yet — schema created in Phase 2)
**wrangler.toml changes:** [[d1_databases]] block added, TMP_DIRECTORY_JSON var added

---

## PHASE 2 — D1 Schema

**Goal:** Create all baseline D1 tables and enable projections for live routes

**Deliverables:**
  1. Create D1 database: `wrangler d1 create taxmonitor-pro-d1`
  2. Apply migrations 0001–0015 in order:
       0001_create_tmp_taxpayer_accounts.sql
       0002_create_tmp_memberships.sql
       0003_create_tmp_inquiries.sql
       0004_create_tmp_intake_sessions.sql
       0005_create_tmp_activity.sql
       0006_create_tmp_preferences.sql
       0007_create_vlp_professionals_cache.sql
       0008_create_tmp_cal_tokens.sql
       0009_create_tmp_documents.sql
       0010_create_tmp_poa_records.sql
       0011_create_tmp_compliance_reports.sql
       0012_create_tmp_support_tickets.sql
       0013_create_tmp_notifications.sql
       0014_create_tmp_email_messages.sql
       0015_create_tmp_magic_link_tokens.sql
  3. Enable D1 projections in executeWritePipeline for all currently live routes:
       - tmp_taxpayer_accounts (PATCH /v1/taxpayer-accounts/{id})
       - tmp_memberships (POST /v1/taxpayer-memberships/free, POST /v1/webhooks/stripe)
       - tmp_inquiries (POST /v1/inquiries)
       - tmp_notifications, tmp_preferences, tmp_support_tickets (existing routes)
  4. Validate projection repair: re-running projections from R2 receipts rebuilds D1

**Contracts changed:** None (upgrading write pipeline implementation, not contracts)
**Migrations:** 0001–0015
**wrangler.toml changes:** None (D1 block already added in Phase 1)

---

## PHASE 3 — Authentication

**Goal:** Replace stub auth with real session management. Wire all auth routes. [Q7]

**Deliverables:**
  1. tmp_session HttpOnly cookie implementation
       - Cookie: Secure; SameSite=Lax; Domain=.taxmonitor.pro; Path=/
       - Signed with SESSION_SECRET
       - TTL: SESSION_TTL_SECONDS = 86400
  2. Real GET /v1/auth/session (reads signed cookie, not x-account-id header)
  3. Real POST /v1/auth/logout (clears tmp_session cookie)
  4. Google OAuth — wire fully:
       GET /v1/auth/google/start    — redirect to Google OIDC authorization endpoint
       GET /v1/auth/google/callback — exchange code, upsert account, set cookie
  5. Magic Link — wire fully:
       POST /v1/auth/magic-link/request — generate token, hash, store in tmp_magic_link_tokens, email link
       GET /v1/auth/magic-link/verify   — verify token hash, mark used, set cookie
  6. SSO OIDC [Q7] — wire fully:
       GET /v1/auth/sso/oidc/start    — redirect to IdP authorization endpoint
       GET /v1/auth/sso/oidc/callback — exchange code, upsert account, set cookie
  7. SSO SAML [Q7] — wire fully:
       GET /v1/auth/sso/saml/start    — generate SAML AuthnRequest, redirect to IdP
       POST /v1/auth/sso/saml/acs     — validate SAML assertion, upsert account, set cookie
  8. Upgrade all auth contracts from LEGACY to CANONICAL format
  9. All auth routes project to D1 tmp_taxpayer_accounts on account creation/upsert
 10. All auth events written to tmp_activity audit log

**wrangler.toml additions (Phase 3):**
  [vars]:
    SSO_SAML_IDP_ENTITY_ID = ""       (set before Phase 3 deploy)
    SSO_SAML_IDP_SSO_URL   = ""       (set before Phase 3 deploy)
  [secrets]:
    SSO_SAML_IDP_CERT                 (SAML IdP certificate — `wrangler secret put`)

**Contracts upgraded:** All 15 auth contracts (LEGACY → CANONICAL)
**Contracts added:** None (all auth routes already have contract files)
**Migrations:** None (tmp_magic_link_tokens already in migration 0015)

---

## PHASE 4 — VLP Directory Sync [Q5]

**Goal:** Replace env var directory stub with real VLP-synced professional cache

**Deliverables:**
  1. Create contracts/tmp.webhooks.vlp-directory.v1.json
  2. Add POST /v1/webhooks/vlp-directory to manifest.js
  3. Implement handler: verify VLP_WEBHOOK_SECRET signature, upsert to vlp_professionals_cache
  4. Wire GET /v1/directory/professionals to vlp_professionals_cache D1 table
  5. Wire GET /v1/directory/professionals/{id} to vlp_professionals_cache D1 table
  6. Upgrade directory contracts from LEGACY to CANONICAL
  7. Create /lib/api/vlp-client.ts — read-only VLP API client (no write functions)

**wrangler.toml additions (Phase 4):**
  [vars]:
    VLP_API_BASE_URL = "https://api.virtuallaunch.pro"
  [secrets]:
    VLP_WEBHOOK_SECRET                (shared with VLP — `wrangler secret put`)

**Contracts created:** tmp.webhooks.vlp-directory.v1.json (1 new)
**Contracts upgraded:** tmp.directory.search.v1.json, tmp.directory.professional.get.v1.json
**Migrations:** None (vlp_professionals_cache table in migration 0007, already applied)

---

## PHASE 5 — Cal.com Integration [Q1] [Q2]

**Goal:** Implement Cal.com OAuth + booking flow for taxpayers and tax professionals

**Deliverables:**
  1. Register TWO separate Cal.com OAuth apps (CAL_APP and CAL_PRO) [Q1]
  2. Update wrangler.toml:
       - Correct CAL_APP_OAUTH_REDIRECT_URI to include /v1/
       - Correct CAL_PRO_OAUTH_REDIRECT_URI to include /v1/
       - Update CAL_APP_OAUTH_CLIENT_ID to actual registered CAL_APP client ID
       - Update CAL_PRO_OAUTH_CLIENT_ID to actual registered CAL_PRO client ID
  3. Create 7 contract files (all CANONICAL):
       tmp.cal.app.oauth.start.v1.json
       tmp.cal.app.oauth.callback.v1.json
       tmp.cal.pro.oauth.start.v1.json
       tmp.cal.pro.oauth.callback.v1.json
       tmp.cal.bookings.list.v1.json
       tmp.cal.bookings.create.v1.json
       tmp.cal.profile.get.v1.json
  4. Add 7 routes to manifest.js
  5. Implement all 7 handlers:
       OAuth start: redirect to Cal.com authorization URL
       OAuth callbacks: exchange code, encrypt token, store in tmp_cal_tokens D1
       Bookings list: read stored token, proxy to Cal.com API
       Bookings create: read stored token, proxy to Cal.com API [Q2]
       Profile get: read stored token, proxy to Cal.com API
  6. Cal.com tokens stored in D1 tmp_cal_tokens: AES-256-GCM encrypted [Q1]

**wrangler.toml changes:**
  Fix redirect URIs (add /v1/ prefix), update client IDs to distinct registered values
  Set CAL_APP_OAUTH_CLIENT_SECRET and CAL_PRO_OAUTH_CLIENT_SECRET via `wrangler secret put`

**Contracts created:** 7 new Cal.com contracts
**Migrations:** None (tmp_cal_tokens table in migration 0008, already applied)
**Depends on:** Phase 3 (real session auth required for OAuth token storage)

---

## PHASE 6 — Intake Sessions

**Goal:** Implement multi-step intake session state persistence

**Deliverables:**
  1. Create intake session contracts (exact routes TBD based on intake flow design)
  2. Add intake session routes to manifest.js
  3. Implement session state write pipeline → tmp_intake_sessions D1
  4. R2 canonical: /r2/tmp_intake_sessions/{session_id}.json
  5. Wire intake flow front-end (app/inquiry.html) to use session persistence

**Contracts created:** TBD (intake session contracts)
**Migrations:** None (tmp_intake_sessions table in migration 0004, already applied)
**Depends on:** Phase 5 (booking flow may be part of late intake steps)

---

## PHASE 7 — Messaging

**Goal:** Wire email sending (Gmail API) and SMS (Twilio). Fix missing SMS contract.

**Deliverables:**
  1. CREATE tmp.notifications.sms.send.v1.json (file is MISSING as of Phase 0)
  2. Implement POST /v1/email/send:
       - Calls Gmail API via Google Workspace service account
       - Uses GOOGLE_PRIVATE_KEY (service account) and GOOGLE_CLIENT_EMAIL
       - Writes outbound record to /r2/email_messages/{message_id}.json
       - Projects to tmp_email_messages D1
       - Upgrade tmp.email.send.v1.json from LEGACY to CANONICAL
  3. Implement POST /v1/notifications/sms/send:
       - Calls Twilio Verify or Twilio Messaging API
       - Uses TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_PHONE_NUMBER
       - Upgrade tmp.notifications.sms.send.v1.json (new file) to CANONICAL
  4. Upgrade webhook contracts (google-email, twilio) to CANONICAL with D1 projections
  5. Wire magic link email delivery (used by Phase 3 — confirm integration point)

**Contracts created:** tmp.notifications.sms.send.v1.json (1 new — fixes MISSING file)
**Contracts upgraded:** tmp.email.send.v1.json, tmp.webhooks.twilio.v1.json, tmp.webhooks.google-email.v1.json
**Migrations:** None (tmp_email_messages in migration 0014, already applied)

---

## PHASE 8 — Search + Filtering

**Goal:** Advanced directory search, filtering, and professional matching improvements

**Deliverables:**
  1. Extend GET /v1/directory/professionals with filter query parameters
       (services, location, budget, availability)
  2. Improve match scoring algorithm for inquiry routing
  3. TBD based on product requirements at time of implementation

**Contracts changed:** tmp.directory.search.v1.json (extend query params, no new file)
**Migrations:** Possible index additions to vlp_professionals_cache
**Depends on:** Phase 4 (directory must be on D1 cache, not env var)

---

## PHASE 9 — Billing + Monitoring Engagement Checkout

**Goal:** Wire post-payment account update, exit survey, and Tax Monitoring engagement
checkout (second Stripe product line — Bronze/Silver/Gold/Snapshot/MFJ plans).

**CORRECTION APPLIED: Monitoring engagement checkout is NEW to Phase 9.**
This is a completely separate Stripe product line from platform memberships.
Two separate D1 projections. Stripe webhook routes by price metadata product_type.

**Deliverables:**
  1. POST /v1/exit-survey → tmp.exit-survey.submit.v1.json [Q4]
       - Triggered on membership cancellation
       - Writes to /r2/tmp_exit_surveys/{survey_id}.json
       - Projects to tmp_exit_surveys D1
  2. PATCH /v1/taxpayer-accounts/{id}/filing-status → tmp.taxpayer-account.filing-status.update.v1.json
       - Updates filing status field post-payment
  3. Monitoring Engagement Checkout — second Stripe checkout flow:
       POST /v1/checkout/sessions → tmp.monitoring-plan.checkout-session.create.v1.json
         - Accepts plan: bronze|silver|gold|snapshot|mfj_addon
         - Creates Stripe checkout session with monitoring-plan price IDs
         - Stripe price metadata must include:
             { "app": "tax-monitor-pro", "product_type": "monitoring_engagement",
               "plan": "bronze"|"silver"|"gold"|"snapshot", "term_weeks": "6"|"8"|"12"|"0",
               "mfj_addon": "false"|"true" }
       GET /v1/checkout/status → tmp.monitoring-plan.checkout-status.get.v1.json
         - Polls Stripe checkout status for monitoring plan session
  4. Upgrade Stripe webhook (tmp.webhooks.stripe.v1.json) to detect product_type:
       product_type = "monitoring_engagement" → write to tmp_monitoring_engagements D1
       product_type = "membership" (or absent) → write to tmp_memberships (existing behavior)
       Webhook creates engagement record in D1 and R2 on checkout.session.completed
  5. D1 migration 0016_create_tmp_exit_surveys.sql [Q4]
  6. D1 migration 0017_create_tmp_monitoring_engagements.sql (NEW — monitoring engagements)

**D1 table: tmp_monitoring_engagements (migration 0017)**
  Columns:
    engagement_id           TEXT PRIMARY KEY    (ENG_{UUID})
    account_id              TEXT NOT NULL       (taxpayer account)
    professional_id         TEXT                (assigned tax pro — null until assigned)
    plan_type               TEXT NOT NULL       (ENUM: bronze|silver|gold|snapshot)
    term_weeks              INTEGER NOT NULL    (6, 8, 12, or 0 for snapshot)
    mfj_addon               INTEGER NOT NULL    (BOOL: 0 or 1)
    status                  TEXT NOT NULL       (ENUM: pending|active|complete|cancelled)
    stripe_subscription_id  TEXT                (null for snapshot — one-time payment)
    plan_start              TEXT                (ISO date)
    plan_end                TEXT                (ISO date — null for snapshot until set)
    created_at              TEXT NOT NULL
    updated_at              TEXT NOT NULL
  Indexes: account_id, professional_id, status, plan_type

**R2 paths added in Phase 9:**
  /r2/tmp_monitoring_engagements/{engagement_id}.json     — engagement record
  /r2/receipts/tmp/monitoring-engagements/{event_id}.json — write receipt
  /r2/tmp_exit_surveys/{survey_id}.json                   — exit survey record

**Monitoring plan pricing (Stripe price IDs — to be registered before Phase 9 deploy):**
  Bronze   — $275, 6-week term, recurring Stripe subscription
  Silver   — $325, 8-week term, recurring Stripe subscription (most popular)
  Gold     — $425, 12-week term, recurring Stripe subscription
  Snapshot — $299, one-time payment (initial pull + one update, no ongoing term)
  MFJ Add-On — +$79, per spouse, applies to any term plan, separate price ID

  7. Cron Trigger — engagement completion handler [Q9]:
       Add [triggers] section to wrangler.toml:
         [triggers]
         crons = ["0 9 * * *"]
       Add scheduled handler to workers/src/index.js:
         Queries D1 tmp_monitoring_engagements WHERE status = 'active'
           AND plan_end IS NOT NULL AND plan_end <= date('now')
         For each matching engagement:
           a. Set status = 'complete' in D1 + R2
           b. Write audit event to tmp_activity (actor_id: 'system')
           c. For Bronze/Silver/Gold (stripe_subscription_id not null):
                Call VLP API via vlp-client.ts to cancel Stripe subscription
                TMP does NOT call Stripe directly — billing writes are VLP-owned
                Log failure to tmp_activity (action: 'subscription_cancel_failed')
  8. plan_end calculation at engagement creation [Q9]:
       Set in checkout.session.completed webhook handler when engagement is created:
         Bronze:  plan_start + 42 days
         Silver:  plan_start + 56 days
         Gold:    plan_start + 84 days
         Snapshot: plan_end = null (set later by Phase 12 on second report delivery)
  9. Snapshot plan_end setter (wired in Phase 12, specified here for cross-reference) [Q9]:
       POST /v1/compliance-reports handler (Phase 12) must:
         a. Count existing reports for the engagement
         b. On second report: set engagement plan_end = date('now') in D1 + R2
       Until plan_end is set, Snapshot engagements have plan_end = null and
       are NOT picked up by the Cron handler.

**Cross-reference — Phase 15 [Q8]:**
  New engagement claim routes are Phase 15 deliverables, not Phase 9.
  Phase 9 creates the engagement record (status: pending, professional_id: null).
  Phase 15 adds:
    GET  /v1/engagements/open                        (tmp.engagement.list-open.v1.json)
    POST /v1/engagements/{engagement_id}/claim       (tmp.engagement.claim.v1.json)
  See Phase 15 for full implementation detail.

**Contracts created:**
  tmp.exit-survey.submit.v1.json
  tmp.taxpayer-account.filing-status.update.v1.json
  tmp.monitoring-plan.checkout-session.create.v1.json
  tmp.monitoring-plan.checkout-status.get.v1.json

**Contracts upgraded:**
  tmp.webhooks.stripe.v1.json (add monitoring engagement routing)
  tmp.membership.checkout-session.create.v1.json (upgrade LEGACY → CANONICAL)
  tmp.membership.checkout-status.get.v1.json (upgrade LEGACY → CANONICAL)
  tmp.membership.free.create.v1.json (add D1 projection step — already CANONICAL)
  tmp.membership.patch.v1.json (upgrade LEGACY → CANONICAL)

**wrangler.toml changes (Phase 9):**
  Add [triggers] section:
    [triggers]
    crons = ["0 9 * * *"]

**Migrations:** 0016_create_tmp_exit_surveys.sql, 0017_create_tmp_monitoring_engagements.sql

---

## PHASE 10 — Token Redemption + TTTMP Integration

**Goal:** Enable taxpayers to redeem tax tool tokens (TTTMP) earned through platform membership

**Deliverables:**
  1. Token balance tracking integration with TTTMP platform
  2. Token grant on membership activation (via Stripe webhook projection)
  3. TMP awards tokens per plan (defined in wrangler.toml TMP_PLAN_*_TAX_TOOL_TOKENS)
  4. TTTMP integration mechanism TBD — see INTEGRATIONS.md TTTMP section
  5. Transcript tokens (TMP_PLAN_*_TRANSCRIPT_TOKENS) — tracking for monitoring features

**Contracts created:** TBD
**Depends on:** Phase 9 (billing fully operational)
**Note:** TMP does NOT host the TTTMP game engine. Tokens are awarded; redemption is at TTTMP.

**Q10 clarification [Q10]:**
  TMP_PLAN_*_TRANSCRIPT_TOKENS are for TTMP use (separate transcript tool platform).
  They do NOT govern transcript uploads within a monitoring engagement.
  Monitoring engagement transcript uploads are unlimited within the plan term — no token check.
  Phase 10 governs TTMP transcript token redemption only. Phase 13 (transcript upload) has
  no dependency on Phase 10.

---

## PHASE 11 — Document Storage [Q6]

**Goal:** Implement secure document upload, storage, and retrieval

**Deliverables:**
  1. Create 6 document contracts (all CANONICAL — see CONTRACTS.md Section 15)
  2. Add 6 routes to manifest.js
  3. Implement upload-init: validate account, generate scoped R2 upload path, return presigned URL
  4. Implement upload-complete: confirm upload, write metadata to D1, write audit event
  5. Implement document get: return metadata (never raw content)
  6. Implement document list-by-account: return metadata list
  7. Implement photo upload (upload-init + upload-complete for profile photos)
  8. All document content encrypted AES-256-GCM before R2 write [Q6]
  9. All document events written to tmp_activity audit log

**R2 paths:**
  /r2/tmp_documents/{account_id}/{document_id}.json   — metadata
  /r2/tmp_documents/{account_id}/{document_id}.enc    — encrypted content
  /r2/tmp_documents/{account_id}/profile-photo.{ext}  — encrypted profile photo

**Contracts created:** 6 document contracts (see CONTRACTS.md Section 15)
**Migrations:** None (tmp_documents in migration 0009, already applied)
**MUST DEPLOY BEFORE PHASE 12.** Rule #10: no live document delivery before storage controls exist.
**Depends on:** Phase 9 (D1 schema must be fully operational)

---

## PHASE 12 — Compliance Reports

**Goal:** Enable tax professionals to deliver compliance reports to taxpayer accounts

**Deliverables:**
  1. Create 4 compliance report contracts (all CANONICAL — see CONTRACTS.md Section 16)
  2. Add 4 routes to manifest.js
  3. POST /v1/compliance-reports — tax pro creates report for taxpayer
       - Auth: role = 'taxpro', professional_id must be in vlp_professionals_cache
       - Report content encrypted at rest in R2
       - Metadata projected to tmp_compliance_reports D1
  4. GET /v1/compliance-reports/{report_id} — serve report (decrypt-on-read or presigned URL)
  5. GET /v1/compliance-reports/by-account/{id} — list for taxpayer (metadata only)
  6. GET /v1/compliance-reports/by-professional/{id} — list created by tax pro

**R2 paths:**
  /r2/tmp_compliance_reports/{account_id}/{report_id}.json — metadata + encrypted content

**Contracts created:** 4 compliance report contracts (see CONTRACTS.md Section 16)
**Migrations:** None (tmp_compliance_reports in migration 0011, already applied)
**Depends on:** Phase 11 (document storage controls must exist first — Rule #10)

---

## PHASE 13 — POA + Transcript Upload

**Goal:** Enable Form 2848 POA authorization and tax pro transcript upload.

**CORRECTION APPLIED — this phase description replaces the prior model:**
  REMOVED: JWT handoff token generation for TTMP
  REMOVED: TTMP redirect
  REMOVED: POST /v1/transcripts/request
  REMOVED: Any reference to TTMP receiving transcript data

  ADDED: Engagement authorization check before transcript upload
  ADDED: POST /v1/transcripts/upload/init (tax pro uploads transcript)
  ADDED: POST /v1/transcripts/upload/complete (confirms upload, writes audit event)

**TTMP has NO role in this flow. Tax pros upload transcripts manually into TMP.**

**Deliverables:**
  1. Create POA contracts (CANONICAL):
       tmp.poa.submit.v1.json
       tmp.poa.get.v1.json
       tmp.poa.list-by-account.v1.json
  2. Add 3 POA routes to manifest.js:
       POST /v1/poa
       GET  /v1/poa/{poa_id}
       GET  /v1/poa/by-account/{account_id}
  3. Implement Form 2848 POA submission:
       - eSign path: POST /v1/poa with signature captured in esign-2848.html
       - Wet-signed path: taxpayer uploads scanned 2848 via Phase 11 document upload
       - CAF number: encrypted AES-256-GCM in R2 (NEVER stored in D1, NEVER in API response)
       - Canonical R2: /r2/tmp_poa_records/{account_id}/{poa_id}.json
       - Projected to tmp_poa_records D1 (without caf_number)
  4. Create transcript upload contracts (CANONICAL):
       tmp.transcript.upload-init.v1.json
       tmp.transcript.upload-complete.v1.json
  5. Add 2 transcript upload routes to manifest.js:
       POST /v1/transcripts/upload/init
       POST /v1/transcripts/upload/complete
  6. Implement transcript upload using presigned R2 URL [Q11]:
       - upload-init: tax pro calls with account_id of taxpayer
           Worker validates:
             a. Caller has role 'taxpro'
             b. Active engagement record exists in tmp_monitoring_engagements
                linking caller's professional_id to the taxpayer's account_id
             c. POA record exists for this account/professional pair (2848 on file)
             d. NO token balance check — monitoring engagements grant unlimited uploads [Q10]
           Worker generates presigned R2 PUT URL [Q11]:
             - R2 key: tmp_transcripts/{account_id}/{document_id}.enc
             - Expiry: 15 minutes
             - Method: PUT, Content-Type: application/octet-stream
           Returns:
             { upload_url: "https://taxmonitor-pro.r2.cloudflarestorage.com/...",
               document_id: "DOC_{UUID}",
               expires_at: "{ISO timestamp}" }
       - Tax pro client encrypts file (AES-256-GCM) BEFORE uploading to presigned URL [Q11]
           Worker never sees the file bytes — encryption enforced by policy, not by Worker
       - upload-complete: tax pro confirms upload
           Verifies file exists at R2 key tmp_transcripts/{account_id}/{document_id}.enc
           Writes metadata to D1 tmp_documents
           Writes audit event to tmp_activity
           Returns { ok: true, document_id }
  7. Transcript storage:
       /r2/tmp_transcripts/{account_id}/{document_id}.enc
         — encrypted by client (AES-256-GCM) before presigned PUT [Q11]
         — account-scoped, audit logged
         — Worker cannot verify encryption state of uploaded blob (known limitation [Q11])
         — Document this limitation in security review before Phase 13 ships

**Contracts created:**
  tmp.poa.submit.v1.json
  tmp.poa.get.v1.json
  tmp.poa.list-by-account.v1.json
  tmp.transcript.upload-init.v1.json
  tmp.transcript.upload-complete.v1.json

**Contracts NOT created (do not implement):**
  ~~tmp.transcript.request.v1.json~~ — INCORRECT MODEL. REMOVED.

**Migrations:** None (tmp_poa_records in migration 0010, already applied)
**Depends on:** Phase 11 (document storage controls), Phase 9 (engagement record must exist)

---

## PHASE 14 — 2FA Challenge Verify

**Goal:** Wire real TOTP verification for two-factor authentication challenge

**Deliverables:**
  1. Select and integrate a TOTP provider library (must run in Cloudflare Workers environment)
  2. Implement POST /v1/auth/2fa/challenge/verify
       - Reads pending TOTP secret from R2 (stored in Phase 0 enroll/init + enroll/verify)
       - Validates submitted 6-digit code against TOTP algorithm
       - On success: sets tmp_session cookie + marks challenge complete
  3. Upgrade tmp.auth.2fa.challenge-verify.v1.json from LEGACY to CANONICAL
  4. Wire 2FA challenge into session establishment flow (Phase 3 auth flows must call
     challenge/verify if 2FA is enabled for the account)

**Contracts upgraded:** tmp.auth.2fa.challenge-verify.v1.json
**Depends on:** Phase 3 (real session management must exist before 2FA challenge makes sense)

---

## PHASE 15 — Tax Pro Routes

**Goal:** Implement professional-facing routes for tax pro accounts (role: 'taxpro')

**Deliverables:**
  1. Tax pro account creation and profile management routes
  2. Engagement claim routes [Q8]:
       GET  /v1/engagements/open                        — list open (unclaimed) engagements
         - Returns all tmp_monitoring_engagements where status = 'pending' AND professional_id IS NULL
         - Auth: role = 'taxpro', status = 'active'
         - Reads from D1 tmp_monitoring_engagements
       POST /v1/engagements/{engagement_id}/claim       — tax pro claims an engagement
         - Auth: role = 'taxpro', status = 'active'
         - Engagement must have status = 'pending' AND professional_id IS NULL
         - On success: professional_id = caller's account_id, status → 'active'
         - Conditional D1 update (WHERE professional_id IS NULL) for race condition safety
         - Returns 409 Conflict if engagement already claimed
         - Updates R2 canonical + D1 tmp_monitoring_engagements
         - Writes audit event to tmp_activity (action: 'engagement_claimed')
  3. 'Verified taxpro' definition [Q8]:
       role: 'taxpro' AND status: 'active' in tmp_taxpayer_accounts
       No additional credential verification step required at this time.
  4. Tax pro dashboard data routes (assigned taxpayer accounts, engagement status)
  5. VLP profile association: link TMP account_id to VLP professional_id
  6. Access control: role = 'taxpro' gate on all tax pro routes
  7. Tax pro compliance report creation (Phase 12 routes already handle this — verify access)

**Contracts created:**
  tmp.engagement.list-open.v1.json     — GET /v1/engagements/open [Q8]
  tmp.engagement.claim.v1.json         — POST /v1/engagements/{engagement_id}/claim [Q8]
  (additional tax pro-specific contracts TBD)

**Depends on:** Phase 3 (auth), Phase 4 (VLP directory — profile association), Phase 9 (engagement records exist)

---

## PHASE 16 — Tax Pro Dashboard + VLP Deep Sync

**Goal:** Full tax pro operational experience + deeper VLP data integration

**Deliverables:**
  1. Tax pro dashboard full data surface (scheduled consultations, engagement history)
  2. Enhanced VLP profile sync (beyond directory cache — full professional profile access)
  3. Cal.com integration for tax pro calendar (depends on Phase 5 CAL_PRO OAuth)
  4. Professional billing summary (read-only via vlp-client.ts — VLP-owned records)
  5. Any remaining post-launch features deferred from earlier phases

**Contracts created:** TBD
**Depends on:** Phase 15 (tax pro routes), Phase 5 (Cal.com), Phase 4 (VLP sync)

---

## MIGRATIONS REFERENCE

```
Migration File                                    Table                        Phase
────────────────────────────────────────────────────────────────────────────────────
0001_create_tmp_taxpayer_accounts.sql             tmp_taxpayer_accounts        2
0002_create_tmp_memberships.sql                   tmp_memberships              2
0003_create_tmp_inquiries.sql                     tmp_inquiries                2
0004_create_tmp_intake_sessions.sql               tmp_intake_sessions          2
0005_create_tmp_activity.sql                      tmp_activity                 2
0006_create_tmp_preferences.sql                   tmp_preferences              2
0007_create_vlp_professionals_cache.sql           vlp_professionals_cache      2
0008_create_tmp_cal_tokens.sql                    tmp_cal_tokens               2
0009_create_tmp_documents.sql                     tmp_documents                2
0010_create_tmp_poa_records.sql                   tmp_poa_records              2
0011_create_tmp_compliance_reports.sql            tmp_compliance_reports       2
0012_create_tmp_support_tickets.sql               tmp_support_tickets          2
0013_create_tmp_notifications.sql                 tmp_notifications            2
0014_create_tmp_email_messages.sql                tmp_email_messages           2
0015_create_tmp_magic_link_tokens.sql             tmp_magic_link_tokens        2/3
0016_create_tmp_exit_surveys.sql                  tmp_exit_surveys             9 [Q4]
0017_create_tmp_monitoring_engagements.sql        tmp_monitoring_engagements   9 (NEW)
```

Migrations 0001–0015 are applied in Phase 2 (batch schema creation).
Migrations 0016–0017 are applied in Phase 9 (post-payment features).
All migrations are sequential and non-destructive.
