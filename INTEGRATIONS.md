# TMP Third-Party Integration Specs
# Platform: Tax Monitor Pro (TMP)
# Last updated: 2026-03-18 (corrections applied — monitoring engagement model)
#
# CORRECTION APPLIED:
#   The IRS/Transcript Handoff section has been replaced entirely.
#   TMP does NOT send transcripts to TTMP via JWT handoff.
#   TTMP has NO role in the transcript flow.
#   Tax pro manually uploads transcripts into TMP.
#   See "Tax Monitoring — Transcript and 2848 Flow" section below.
#
# Contents:
#   1. Stripe — Membership + Monitoring Engagement Billing
#   2. Cal.com — Booking Integration [Q1] [Q2]
#   3. Google OAuth — Authentication
#   4. Google Workspace — Email (Gmail API)
#   5. Twilio — SMS / Verify
#   6. VLP (Virtual Launch Pro) — Read-Only Data Integration [Q5]
#   7. TTTMP — Tax Tool Token Handoff
#   8. Tax Monitoring — Transcript and 2848 Flow (replaces prior IRS/TTMP section)

---

## 1. STRIPE — MEMBERSHIP + MONITORING ENGAGEMENT BILLING

TMP uses Stripe for two completely separate product lines.
TMP calls Stripe only for: checkout session creation, checkout status polling,
and webhook receipt. It does NOT call the Stripe Subscriptions API directly.
All subscription create/update/cancel writes are VLP-owned.

---

### 1A. PRODUCT LINE 1 — Platform Memberships (recurring subscription)

Plans: Free | Essential ($9/mo) | Plus ($19/mo) | Premier ($39/mo)
Annual billing: Essential ($5.40/mo), Plus ($11.40/mo), Premier ($23.40/mo)

**Stripe Price IDs (platform memberships):**
```
STRIPE_TMP_PRICE_FREE_MONTHLY         = "price_1TB2XMQEa4WBi79g9MrIQ8sE"
STRIPE_TMP_PRICE_ESSENTIAL_MONTHLY    = "price_1TB2g5QEa4WBi79gzBFxy2se"
STRIPE_TMP_PRICE_ESSENTIAL_YEARLY     = "price_1TB2g5QEa4WBi79ghK9W4dCI"
STRIPE_TMP_PRICE_PLUS_MONTHLY         = "price_1TB2k2QEa4WBi79g3hyGQ5Cp"
STRIPE_TMP_PRICE_PLUS_YEARLY          = "price_1TB2kxQEa4WBi79gQ62yKXvQ"
STRIPE_TMP_PRICE_PREMIER_MONTHLY      = "price_1TB2t8QEa4WBi79g3qhzDYMZ"
STRIPE_TMP_PRICE_PREMIER_YEARLY       = "price_1TB2t8QEa4WBi79gQwOSRGsb"
```

**Stripe Product IDs (platform memberships):**
```
STRIPE_TMP_PRODUCT_FREE       = "prod_U9LDhnUUoaV82l"
STRIPE_TMP_PRODUCT_ESSENTIAL  = "prod_U9LM3whygrnrY0"
STRIPE_TMP_PRODUCT_PLUS       = "prod_U9LQhYkDTaATna"
STRIPE_TMP_PRODUCT_PREMIER    = "prod_U9LakGL5MJfj1x"
```

**Stripe price metadata format (platform membership):**
```json
{
  "app": "tax-monitor-pro",
  "product_type": "membership",
  "plan": "essential" | "plus" | "premier",
  "billing_period": "monthly" | "yearly"
}
```

**Checkout flow (platform membership):**
  1. Client calls POST /v1/checkout/sessions (contract: tmp.membership.checkout-session.create.v1.json)
  2. TMP Worker creates Stripe Checkout Session via Stripe API
  3. Client redirects to Stripe hosted checkout page
  4. Client polls GET /v1/checkout/status (contract: tmp.membership.checkout-status.get.v1.json)
  5. On checkout.session.completed Stripe webhook:
       - Worker detects product_type = "membership" in price metadata
       - Creates/updates membership record in R2 (/r2/taxpayer_memberships/{membership_id}.json)
       - Projects to tmp_memberships D1

---

### 1B. PRODUCT LINE 2 — Tax Monitoring Engagements (separate purchase)

Plans: Bronze ($275, 6-week) | Silver ($325, 8-week) | Gold ($425, 12-week) | Snapshot ($299, one-time)
MFJ Add-On: +$79, per spouse, applies to any term plan, separate price ID

These are purchased separately from platform memberships.
A taxpayer can hold a platform membership AND a monitoring engagement simultaneously.
Stripe price IDs for monitoring plans are SEPARATE from membership price IDs.
These price IDs must be registered in Stripe before Phase 9 deploys.

**Stripe price metadata format (monitoring engagement):**
```json
{
  "app": "tax-monitor-pro",
  "product_type": "monitoring_engagement",
  "plan": "bronze" | "silver" | "gold" | "snapshot",
  "term_weeks": "6" | "8" | "12" | "0",
  "mfj_addon": "false" | "true"
}
```

**Plan details:**
```
Plan      Price   Term      Billing Type            Most Popular
─────────────────────────────────────────────────────────────────
Bronze    $275    6 weeks   Stripe subscription
Silver    $325    8 weeks   Stripe subscription     YES
Gold      $425    12 weeks  Stripe subscription
Snapshot  $299    N/A       One-time payment        (no ongoing term)
MFJ       +$79    per plan  Add-on price ID         (per spouse)
```

**Checkout flow (monitoring engagement):**
  1. Client calls POST /v1/checkout/sessions (contract: tmp.monitoring-plan.checkout-session.create.v1.json)
  2. TMP Worker creates Stripe Checkout Session with monitoring-plan price ID
  3. Client redirects to Stripe hosted checkout page
  4. Client polls GET /v1/checkout/status (contract: tmp.monitoring-plan.checkout-status.get.v1.json)
  5. On checkout.session.completed Stripe webhook:
       - Worker detects product_type = "monitoring_engagement" in price metadata
       - Creates engagement record in D1 tmp_monitoring_engagements
       - Creates engagement record in R2 (/r2/tmp_monitoring_engagements/{engagement_id}.json)
       - Writes receipt to /r2/receipts/tmp/monitoring-engagements/{event_id}.json

---

### 1C. STRIPE WEBHOOK ROUTING

Webhook endpoint: POST /v1/webhooks/stripe (contract: tmp.webhooks.stripe.v1.json)
Signature verification: STRIPE_WEBHOOK_SECRET (wrangler secret)

The webhook handler must detect product_type in Stripe price metadata and route accordingly:

```
checkout.session.completed:
  if price metadata product_type == "monitoring_engagement":
    → create record in tmp_monitoring_engagements D1
    → write R2 engagement record at /r2/tmp_monitoring_engagements/{engagement_id}.json
    → write receipt at /r2/receipts/tmp/monitoring-engagements/{event_id}.json
  else (product_type == "membership" or absent):
    → create/update record in tmp_memberships D1 (existing behavior)
    → write R2 membership record at /r2/taxpayer_memberships/{membership_id}.json

customer.subscription.updated:
  route by subscription metadata (same product_type detection logic)
  membership updates → tmp_memberships
  monitoring engagement updates → tmp_monitoring_engagements

customer.subscription.deleted:
  route by subscription metadata
  membership cancellations → update tmp_memberships status to cancelled
  monitoring engagement cancellations → update tmp_monitoring_engagements status to cancelled
```

**Stripe secrets (wrangler secret put):**
```
STRIPE_SECRET_KEY       — Stripe secret key (used to call Stripe API)
STRIPE_WEBHOOK_SECRET   — Stripe webhook signature verification key
```

---

## 2. CAL.COM — BOOKING INTEGRATION [Q1] [Q2]

**Two separate registered OAuth apps. DECISION CLOSED [Q1].**

See DECISIONS.md Q1 and Q2 for the full rationale.

**App registrations:**
```
CAL_APP — taxpayer booking flow
  AUTHORIZE_URL  = "https://app.cal.com/auth/oauth2/authorize"
  CLIENT_ID      = CAL_APP_OAUTH_CLIENT_ID (wrangler var — must be unique registered ID)
  CLIENT_SECRET  = CAL_APP_OAUTH_CLIENT_SECRET (wrangler secret)
  REDIRECT_URI   = "https://api.taxmonitor.pro/v1/cal/app/oauth/callback"
  TOKEN_URL      = "https://api.cal.com/v2/auth/oauth2/token"

CAL_PRO — tax professional calendar management
  AUTHORIZE_URL  = "https://app.cal.com/auth/oauth2/authorize"
  CLIENT_ID      = CAL_PRO_OAUTH_CLIENT_ID (wrangler var — must be unique registered ID)
  CLIENT_SECRET  = CAL_PRO_OAUTH_CLIENT_SECRET (wrangler secret)
  REDIRECT_URI   = "https://api.taxmonitor.pro/v1/cal/pro/oauth/callback"
  TOKEN_URL      = "https://api.cal.com/v2/auth/oauth2/token"
```

**wrangler.toml gap (fix in Phase 5):**
  Both redirect URIs currently missing /v1/ prefix — must be corrected.
  Both client IDs currently share the same placeholder value — must be split.

**OAuth flow (per app):**
  1. GET /v1/cal/app/oauth/start   — redirect to Cal.com authorization URL with client_id
  2. GET /v1/cal/app/oauth/callback — exchange code for token via Cal.com token endpoint
  3. Encrypt token with ENCRYPTION_KEY (AES-256-GCM)
  4. Store in D1 tmp_cal_tokens: { account_id, app_type: 'cal_app', token_ciphertext, token_iv, expires_at }
  5. Subsequent API calls: read token from D1, decrypt, proxy to Cal.com API

**Booking API calls (Phase 5):**
  GET  /v1/cal/bookings  → Cal.com v2 GET /bookings   (proxied with decrypted token)
  POST /v1/cal/bookings  → Cal.com v2 POST /bookings  (proxied with decrypted token)
  GET  /v1/cal/profile   → Cal.com v2 GET /me         (proxied with decrypted token)

**Token storage rules:**
  token_ciphertext: AES-256-GCM encrypted — NEVER returned raw in API responses
  token_iv: stored alongside ciphertext in D1
  Expires_at: Cal.com token TTL — refresh flow TBD in Phase 5

**Webhook (optional, Phase 5 or 6):**
  Cal.com can push booking events to TMP via webhook.
  If implemented: POST /v1/webhooks/cal
  Signed with CAL_WEBHOOK_SECRET (wrangler secret).
  TBD: whether booking events are stored in TMP or remain entirely in Cal.com.

---

## 3. GOOGLE OAUTH — AUTHENTICATION

Used for: Social login (taxpayer and taxpro accounts) — Phase 3

**Endpoints:**
  Authorization: https://accounts.google.com/o/oauth2/v2/auth
  Token:         https://oauth2.googleapis.com/token
  UserInfo:      https://www.googleapis.com/oauth2/v3/userinfo

**wrangler.toml config:**
  GOOGLE_CLIENT_ID     = ""  (set before Phase 3 deploy)
  GOOGLE_REDIRECT_URI  = "https://api.taxmonitor.pro/v1/auth/google/callback"

**Secrets:**
  GOOGLE_CLIENT_SECRET — Google OAuth client secret (wrangler secret)

**Flow:**
  1. GET /v1/auth/google/start     — redirect to Google OIDC authorization URL
  2. GET /v1/auth/google/callback  — exchange code for ID token, extract user info
  3. Upsert account in R2 + tmp_taxpayer_accounts D1
  4. Set tmp_session HttpOnly cookie (signed with SESSION_SECRET)

**Scopes requested:** openid, email, profile

**Account upsert rules:**
  - If email exists in tmp_taxpayer_accounts: update + set session (login)
  - If email not found: create new account with role 'taxpayer' (registration)
  - Role is set at creation and cannot be changed via API

---

## 4. GOOGLE WORKSPACE — EMAIL (GMAIL API)

Used for: Transactional email (magic links, notifications, support) — Phase 7

**Service account:**
  GOOGLE_CLIENT_EMAIL          = "tax-monitor-worker@tax-monitor-pro.iam.gserviceaccount.com"
  GOOGLE_TOKEN_URI             = "https://oauth2.googleapis.com/token"
  GOOGLE_PRIVATE_KEY           = (wrangler secret — service account private key)

**Workspace users (impersonated by service account):**
  GOOGLE_WORKSPACE_USER_INFO      = "info@taxmonitor.pro"
  GOOGLE_WORKSPACE_USER_NO_REPLY  = "no-reply@taxmonitor.pro"
  GOOGLE_WORKSPACE_USER_SUPPORT   = "support@taxmonitor.pro"

**API:** Gmail API v1 — POST /gmail/v1/users/{userId}/messages/send

**Auth flow:**
  1. Worker signs a JWT with GOOGLE_PRIVATE_KEY to obtain a service account access token
  2. Uses domain-wide delegation to impersonate the appropriate Workspace user
  3. Sends email via Gmail API on behalf of the impersonated user

**Email types and sending user:**
  Magic link auth emails:     no-reply@taxmonitor.pro
  Notification emails:        no-reply@taxmonitor.pro
  Support communications:     support@taxmonitor.pro
  Informational/onboarding:   info@taxmonitor.pro

**Outbound email storage:**
  Outbound record written to R2: /r2/email_messages/{message_id}.json
  Projected to D1: tmp_email_messages
  Inbound Google Pub/Sub push: POST /v1/webhooks/google-email
  Contract: tmp.webhooks.google-email.v1.json

**Webhook:**
  Google Workspace push notifications are received at POST /v1/webhooks/google-email
  (email delivery status updates, bounce handling)

---

## 5. TWILIO — SMS / VERIFY

Used for: SMS notifications, phone verification — Phase 7

**Config:**
  TWILIO_ACCOUNT_SID         = ""  (wrangler var — set before Phase 7 deploy)
  TWILIO_PHONE_NUMBER        = ""  (wrangler var — sending number)
  TWILIO_VERIFY_SERVICE_SID  = ""  (wrangler var — Verify service for OTP)

**Secrets:**
  TWILIO_AUTH_TOKEN     — Twilio REST API auth token (wrangler secret)
  TWILIO_WEBHOOK_SECRET — Twilio webhook signature verification (wrangler secret)

**APIs used:**
  Twilio Messaging API: POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
  Twilio Verify API:    POST https://verify.twilio.com/v2/Services/{SID}/Verifications
                        POST https://verify.twilio.com/v2/Services/{SID}/VerificationCheck

**SMS types:**
  Transactional notifications: POST /v1/notifications/sms/send
    Contract: tmp.notifications.sms.send.v1.json (MISSING FILE — create in Phase 7)

**Inbound webhook:**
  POST /v1/webhooks/twilio — receives Twilio delivery status callbacks
  Signed with TWILIO_WEBHOOK_SECRET
  Contract: tmp.webhooks.twilio.v1.json

---

## 6. VLP (VIRTUAL LAUNCH PRO) — READ-ONLY DATA INTEGRATION [Q5]

TMP is a READ-ONLY consumer of VLP data. TMP NEVER writes to VLP-owned records.

**VLP Worker API:**
  Base URL: https://api.virtuallaunch.pro  (VLP_API_BASE_URL — added in Phase 4)

**Integration client:** /web/lib/api/vlp-client.ts
  - Server-side only — never called from browser
  - No write functions — read-only
  - CORS on VLP is locked; TMP cannot call VLP API from the browser

**Data TMP reads from VLP:**
  /r2/professionals/{professional_id}.json     — professional profile
  /r2/profiles/{professional_id}.json           — VLP public profile data
  /r2/memberships/{membership_id}.json          — VLP shared operational membership
  /r2/tokens/{account_id}.json                  — VLP token balance ledger
  /r2/billing_customers/{account_id}.json       — VLP billing customer record
  /r2/billing_subscriptions/{membership_id}.json — VLP subscription record
  /r2/accounts_vlp/{account_id}.json             — VLP account record

**Directory sync model [Q5]:**
  VLP pushes professional profile updates to TMP via signed webhook.
  Webhook endpoint: POST /v1/webhooks/vlp-directory
  Signature: HMAC-SHA256 with VLP_WEBHOOK_SECRET
  TMP caches in D1: vlp_professionals_cache
  TMP directory search reads from local D1 cache (not VLP API at query time)
  See DECISIONS.md Q5.

**Billing writes:**
  TMP never calls Stripe Subscriptions API directly.
  All subscription create/update/cancel writes go through VLP API routes.
  TMP only calls Stripe for: checkout session creation, status polling, webhook receipt.

**Forbidden writes (TMP must never write to):**
  /r2/professionals/*           — VLP owns professional profiles
  /r2/profiles/*                — VLP owns public professional profiles
  /r2/billing_customers/*       — VLP owns billing customer records
  /r2/billing_subscriptions/*   — VLP owns subscription records
  /r2/billing_invoices/*        — VLP owns invoice records
  /r2/billing_payment_intents/* — VLP owns payment intent records
  /r2/billing_payment_methods/* — VLP owns payment method records
  /r2/billing_setup_intents/*   — VLP owns setup intent records
  /r2/accounts_vlp/*            — VLP owns VLP account records
  /r2/memberships/*             — VLP owns shared operational memberships
  /r2/tokens/*                  — VLP owns token balance ledger

---

## 7. TTTMP — TAX TOOL TOKEN HANDOFF

TTTMP is the Tax Tool / Game Platform (separate product from TMP).
TMP awards tax tool tokens to membership accounts. Users redeem tokens at TTTMP.
TMP does NOT host or run the TTTMP game engine.

**Token grants per platform membership plan:**
```
Plan       Tax Tool Tokens / month  Transcript Tokens / month
─────────────────────────────────────────────────────────────
Free       0                        0
Essential  5                        2
Plus       15                       5
Premier    40                       10
```

Token grant vars in wrangler.toml:
  TMP_PLAN_FREE_TAX_TOOL_TOKENS      = "0"
  TMP_PLAN_FREE_TRANSCRIPT_TOKENS    = "0"
  TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS = "5"
  TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS = "2"
  TMP_PLAN_PLUS_TAX_TOOL_TOKENS      = "15"
  TMP_PLAN_PLUS_TRANSCRIPT_TOKENS    = "5"
  TMP_PLAN_PREMIER_TAX_TOOL_TOKENS   = "40"
  TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS = "10"

**Token flow:**
  1. Taxpayer activates platform membership (via Stripe checkout or free membership creation)
  2. Stripe webhook (or free creation handler) triggers token grant
  3. TMP awards tokens — mechanism TBD in Phase 10
     Options: direct VLP token ledger write via VLP API (following Q3 — VLP owns token ledger)
              OR TMP-native token tracking that syncs to TTTMP
  4. User visits TTTMP to redeem tokens
  5. TTTMP integration mechanism fully defined in Phase 10

---

**IMPORTANT — TWO SEPARATE TRANSCRIPT TOKEN POOLS [Q10]. DECISION CLOSED.**

```
Pool 1 — Platform membership transcript tokens (TMP_PLAN_*_TRANSCRIPT_TOKENS):
  Awarded to: Essential / Plus / Premier membership holders
  Purpose:    TTMP use (the separate transcript tool platform)
  Governed by: Phase 10 (Token Redemption)
  Token check: YES — balance decrements when redeemed at TTMP
  Has NOTHING to do with monitoring engagement transcript uploads

Pool 2 — Monitoring engagement transcript uploads:
  Granted by: Bronze / Silver / Gold / Snapshot plan purchase
  Purpose:    Tax pro uploads transcript files into TMP for the engagement
  Governed by: Phase 13 (POA + Transcript Upload)
  Token check: NONE — unlimited uploads within the plan term
  Constrained only by: active engagement + POA on file + correct taxpro assigned
```

Do not conflate these two pools. They operate in completely separate flows.

**What TMP does NOT do:**
  - TMP does not host the TTTMP game engine
  - TMP does not process TTTMP gameplay events
  - TMP does not receive TTTMP results or scores
  - TMP does not generate JWT tokens to send users to TTTMP (handoff mechanism TBD Phase 10)
  - TMP does NOT apply transcript token balance checks to monitoring engagement uploads [Q10]

---

## 8. TAX MONITORING — TRANSCRIPT AND 2848 FLOW

**CORRECTION: This section replaces the prior "IRS/Transcript Handoff" section entirely.**

Purpose: Authorize and receive IRS transcript data for monitoring engagements.
TMP does NOT call IRS TDS API directly — no automated transcript pull.
TTMP has NO role in this flow.
No JWT handoff token is generated for transcripts.
No redirect to TTMP from the monitoring flow.

---

### Product Line Context

This flow is part of Product Line 2 — Tax Monitoring Engagements.
A taxpayer must have an active monitoring engagement (Bronze/Silver/Gold/Snapshot)
before this flow can proceed. Engagement created in Phase 9 via Stripe checkout.

---

### Full Flow

```
Step 1 — Taxpayer purchases monitoring plan
  POST /v1/checkout/sessions (contract: tmp.monitoring-plan.checkout-session.create.v1.json)
  → Stripe checkout (Bronze | Silver | Gold | Snapshot)
  → checkout.session.completed webhook creates engagement record:
       D1: tmp_monitoring_engagements (status: pending, professional_id: null)
       R2: /r2/tmp_monitoring_engagements/{engagement_id}.json

Step 2 — Taxpayer completes Form 2848 authorization (two paths)

  PATH A — eSign (electronic signature):
    Source page: esign-2848.html (app/ directory)
    Route: POST /v1/poa (contract: tmp.poa.submit.v1.json)
    Worker stores:
      R2: /r2/tmp_poa_records/{account_id}/{poa_id}.json
          { poaId, accountId, professionalId, cafNumberCiphertext, signatureType: "esign",
            signedAt, status, createdAt }
      cafNumber: AES-256-GCM encrypted with ENCRYPTION_KEY before write
      D1: tmp_poa_records (WITHOUT caf_number — metadata only)

  PATH B — Wet-signed (scanned upload):
    Taxpayer uploads scanned Form 2848 via Phase 11 document upload routes
    POST /v1/documents/upload/init
    POST /v1/documents/upload/complete
    Document stored at: /r2/tmp_documents/{account_id}/{document_id}.enc (encrypted)
    POA record still created via POST /v1/poa with signatureType: "wet-signed"
    and document_id reference

Step 3 — Tax pro self-claims engagement [Q8]. DECISION CLOSED.
  Tax pro calls GET /v1/engagements/open to see unclaimed engagements
  Tax pro calls POST /v1/engagements/{engagement_id}/claim to claim one
    - Auth: role = 'taxpro', status = 'active'
    - Engagement must have status = 'pending' AND professional_id IS NULL
    - Conditional D1 update: WHERE professional_id IS NULL (race condition safe)
    - On success: professional_id = caller's account_id, status → 'active'
    - Returns 409 Conflict if already claimed by another taxpro
    - Writes audit event: { action: 'engagement_claimed', actor_id: taxpro account_id }
  D1: tmp_monitoring_engagements.professional_id = claimer's account_id

Step 4 — Tax pro uploads transcript file (PDF or XML) via presigned R2 URL [Q11]. DECISION CLOSED.

  4a. Tax pro calls POST /v1/transcripts/upload/init
      Contract: tmp.transcript.upload-init.v1.json
      Request body: { account_id: "ACCT_...", engagement_id: "ENG_..." }
      Worker validates:
        a. Caller session has role 'taxpro'
        b. Active engagement record exists in tmp_monitoring_engagements where:
             engagement.account_id = request.account_id AND
             engagement.professional_id = caller's account_id AND
             engagement.status = 'active'
        c. POA record exists for this account_id + professional_id pair (2848 on file)
        d. NO token balance check — monitoring engagements grant unlimited uploads [Q10]
      Worker generates presigned R2 PUT URL [Q11]:
        - R2 key: tmp_transcripts/{account_id}/{document_id}.enc
        - Expiry: 15 minutes
        - Method: PUT, Content-Type: application/octet-stream
      Response:
        { upload_url: "https://taxmonitor-pro.r2.cloudflarestorage.com/...",
          document_id: "DOC_{UUID}",
          expires_at: "{ISO timestamp — 15 min from generation}" }

  4b. Tax pro CLIENT encrypts the transcript file (AES-256-GCM) BEFORE upload [Q11]
      Tax pro client PUTs encrypted bytes directly to the presigned URL.
      Worker never sees the file bytes — no Worker-side encryption or validation of content.

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ ENCRYPTION RESPONSIBILITY NOTE [Q11]                                        │
  │ The transcript upload uses a presigned R2 URL. The Worker never sees the    │
  │ file bytes. The tax pro client is responsible for encrypting the file       │
  │ (AES-256-GCM) before uploading to the presigned URL.                       │
  │                                                                             │
  │ The Worker CANNOT verify AES encryption of an opaque blob at               │
  │ upload-complete. Encryption is enforced by policy, not by the Worker.      │
  │                                                                             │
  │ Known limitation: a tax pro client that uploads unencrypted bytes will not  │
  │ be rejected by the upload-complete handler. This must be documented in      │
  │ security review before Phase 13 ships.                                      │
  │                                                                             │
  │ Mitigation: the upload-complete handler verifies the file EXISTS at the     │
  │ expected R2 key but cannot verify encryption state.                         │
  └─────────────────────────────────────────────────────────────────────────────┘

  4c. Tax pro calls POST /v1/transcripts/upload/complete
      Contract: tmp.transcript.upload-complete.v1.json
      Request body: { document_id: "DOC_...", engagement_id: "ENG_...", account_id: "ACCT_..." }
      Worker:
        a. Verifies file exists at R2 key tmp_transcripts/{account_id}/{document_id}.enc
        b. Writes metadata to D1 tmp_documents
        c. Writes audit event to D1 tmp_activity:
             { action: "transcript_upload", resource_type: "transcript",
               resource_id: document_id, actor_id: caller's account_id,
               account_id: taxpayer account_id }
      Response: { ok: true, document_id: "DOC_..." }

  Transcript stored at:
    /r2/tmp_transcripts/{account_id}/{document_id}.enc
    — encrypted by client before presigned PUT (AES-256-GCM) [Q11]
    — account-scoped, audit logged
    — Worker cannot verify encryption state of uploaded blob (policy-enforced) [Q11]
    — NEVER returned as raw bytes in API responses

Step 5 — Tax pro delivers analysis as compliance report
  POST /v1/compliance-reports (Phase 12 route)
  Report encrypted at rest in R2: /r2/tmp_compliance_reports/{account_id}/{report_id}.json
  Projected to D1: tmp_compliance_reports

Step 6 — Taxpayer reads report in TMP dashboard
  GET /v1/compliance-reports/by-account/{account_id} — list reports
  GET /v1/compliance-reports/{report_id}              — read report (decrypt-on-read)

Step 7 — For term plans (Bronze/Silver/Gold): cycle repeats per plan schedule
  engagement.status remains 'active'
  plan_end date defines monitoring period
  At plan_end: engagement.status → 'complete'
  For Snapshot: engagement.status → 'complete' after second update delivered
```

---

### Storage

```
R2 paths owned by TMP (Phase 13):
  /r2/tmp_poa_records/{account_id}/{poa_id}.json
    Fields: poaId, accountId, professionalId, cafNumberCiphertext (encrypted),
            signatureType (esign|wet-signed), documentId (wet-signed only),
            signedAt, status (active|revoked), createdAt

  /r2/tmp_transcripts/{account_id}/{document_id}.enc
    Encrypted transcript file (AES-256-GCM)
    NOT metadata — this is the encrypted file content
    Same controls as Phase 11 document storage

D1 tables (projections):
  tmp_poa_records — POA metadata without caf_number
  tmp_documents   — transcript file metadata (after upload-complete)
  tmp_activity    — audit events for upload init and complete
  tmp_monitoring_engagements — engagement status (Phase 9)
```

---

### CAF Number Handling

CAF (Centralized Authorization File) numbers appear on Form 2848.
These are IRS identifiers for authorized representatives.

Storage rules (strict):
  - Encrypted with ENCRYPTION_KEY (AES-256-GCM) before R2 write
  - Stored in R2 only at /r2/tmp_poa_records/{account_id}/{poa_id}.json as cafNumberCiphertext
  - NEVER stored in D1 (even encrypted)
  - NEVER returned in any API response — not even as ciphertext
  - CAF number field is stripped before D1 projection
  - CAF number field is stripped from all API response shapes

---

### Worker Routes (Phase 13)

```
POST /v1/poa                             — submit Form 2848 POA (Phase 13)
GET  /v1/poa/{poa_id}                    — get POA record (Phase 13)
GET  /v1/poa/by-account/{account_id}     — list POA records for account (Phase 13)
POST /v1/transcripts/upload/init         — tax pro initiates transcript upload (Phase 13)
POST /v1/transcripts/upload/complete     — confirms upload, audit event (Phase 13)
```

All Phase 13 routes require:
  - Phase 11 (document storage controls) deployed and operational
  - Phase 9 (monitoring engagement record) created for the account in question

---

### What This Flow Does NOT Do

- TMP does NOT call IRS TDS (Transcript Delivery System) API
- TMP does NOT generate automated transcript pulls
- TTMP has NO involvement in transcript storage, delivery, or display
- No JWT handoff token is generated for transcripts
- No redirect to TTMP from any monitoring or transcript route
- Tax pros do not use TTMP to deliver transcripts — they upload directly into TMP
- The old POST /v1/transcripts/request route is NOT implemented (removed from plan)
- TMP does NOT encrypt transcript bytes server-side — client encrypts before
  presigned URL upload (Worker never sees file bytes — see Q11) [Q11]
- Monitoring engagements do NOT consume transcript tokens — platform membership
  transcript tokens (TMP_PLAN_*_TRANSCRIPT_TOKENS) are for TTMP use only [Q10]
- Engagements are NOT admin-assigned or algorithm-matched — tax pros self-claim
  from the open engagement pool (see Q8) [Q8]

---

## ENVIRONMENT AND SECRETS REFERENCE

All secrets are set via `wrangler secret put` — never committed to source control.

**Secrets currently defined:**
  ENCRYPTION_KEY          — AES-256-GCM key for document/token/CAF encryption
  GOOGLE_CLIENT_SECRET    — Google OAuth client secret
  JWT_SECRET              — JWT signing key (magic link + internal use)
  SESSION_SECRET          — tmp_session cookie signing key
  SSO_OIDC_CLIENT_SECRET  — OIDC provider client secret
  TWOFA_ENCRYPTION_KEY    — 2FA recovery code encryption key
  STRIPE_SECRET_KEY       — Stripe secret key
  STRIPE_WEBHOOK_SECRET   — Stripe webhook signature verification
  CAL_APP_OAUTH_CLIENT_SECRET — Cal App OAuth client secret
  CAL_PRO_OAUTH_CLIENT_SECRET — Cal Pro OAuth client secret
  CAL_WEBHOOK_SECRET      — Cal.com webhook signature verification
  GOOGLE_PRIVATE_KEY      — Google service account private key (Gmail API)
  TWILIO_AUTH_TOKEN       — Twilio REST API auth token
  TWILIO_WEBHOOK_SECRET   — Twilio webhook signature verification

**Secrets to be added by phase:**
  Phase 3: SSO_SAML_IDP_CERT      — SAML IdP certificate [Q7]
  Phase 4: VLP_WEBHOOK_SECRET     — VLP → TMP directory sync webhook secret [Q5]

**NOTE on JWT_SECRET:**
  JWT_SECRET is used for magic link token signing/verification (Phase 3) and any
  other internal JWT use cases. It is NOT used for TTMP transcript handoff tokens —
  that model has been removed. The secret remains required for magic link auth.
