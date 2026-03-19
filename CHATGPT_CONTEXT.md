# CHATGPT_CONTEXT.md
# Tax Monitor Pro (TMP) — Master Context Document
# This file is the complete source of truth for the TMP ecosystem.
# Read this file at the start of every TMP development session.
# Last updated: 2026-03-18 (post-decision integration, Phases 0–16 locked)

---

## HOW TO USE THIS DOCUMENT

- This document is the complete source of truth for the TMP ecosystem.
- Do not invent routes, payloads, storage paths, or IDs not defined here.
- Do not modify contracts without explicit instruction.
- Read this file at the start of every TMP development session.
- For session discipline: one file or route group per prompt. Use context resets if the
  session degrades. Reference the companion files for detail on each domain:
    ROUTES.md       — flat Worker route list with manifest status
    STORAGE.md      — R2 and D1 path map
    CONTRACTS.md    — contract coverage table (68 total)
    DECISIONS.md    — 7 closed architectural decisions (Q1–Q7)
    PHASES.md       — locked migration phase plan (Phases 0–16)
    INTEGRATIONS.md — third-party integration specs

---

## PART 1 — PLATFORM IDENTITY

**Full name:** Tax Monitor Pro (TMP)

**Role in VLP ecosystem:**
TMP is the taxpayer discovery and membership platform. It connects taxpayers to tax
professionals and provides a structured entry point into the broader VLP tax service
ecosystem.

**URLs:**
  Frontend:   https://taxmonitor.pro
  App:        https://app.taxmonitor.pro
  Worker API: https://api.taxmonitor.pro

**User types:**
  taxpayer — taxpayers seeking tax help; role: 'taxpayer'
  taxpro   — tax professionals listed in TMP directory; role: 'taxpro'

**Relationship to other VLP platforms:**

  VLP (Virtual Launch Pro):
    - Canonical owner of professional profiles, billing writes, shared operational records
    - TMP reads VLP data via vlp-client.ts (read-only, never writes)
    - All billing subscription writes (create/update/cancel) go through VLP API routes
    - TMP never writes to VLP-owned R2 paths or VLP D1 tables
    - VLP pushes professional profile updates to TMP via signed webhook [Q5]

  TTMP (Transcript Tool / Tax Monitor Pro):
    - Transcript parsing engine
    - TMP sends users to TTMP via a signed JWT handoff token
    - TMP never absorbs TTMP functionality
    - Handoff: POST /v1/transcripts/request generates a 15-minute single-use JWT

  TTTMP (Tax Tool / Game Platform):
    - Game execution platform
    - TMP awards tax tool tokens to membership accounts
    - Users redeem tokens at TTTMP
    - TMP does not host or run the game engine

**The one rule that overrides everything:**
TMP does not write to VLP-owned canonical records.
All shared operational writes (billing, professional profiles, VLP token ledger) go
through VLP API routes. TMP owns its own R2 paths and D1 tables only.

---

## PART 2 — STACK AND TARGET STRUCTURE

**Frontend:** Next.js 15 + Tailwind CSS 4 + @cloudflare/next-on-pages
**Backend:** Cloudflare Worker (workers/src/index.js)
**Database:** Cloudflare D1 (binding: DB, database: taxmonitor-pro-d1)
**Storage:** Cloudflare R2 (binding: R2_BUCKET, bucket: taxmonitor-pro)
**Auth:** HttpOnly cookie (tmp_session), Google OAuth, Magic Link, SSO (OIDC + SAML)
  - SSO is required for launch — not a post-launch feature [Q7]
  - Cookie attributes: Secure; SameSite=Lax; Domain=.taxmonitor.pro; Path=/
**Billing:** Stripe (checkout sessions + webhook). Billing subscription writes via VLP.
**Booking:** Cal.com — TWO distinct registered OAuth apps [Q1]:
  CAL_APP: taxpayer booking flow
  CAL_PRO: tax professional calendar management
**Deploy:** Cloudflare Pages (frontend) + wrangler deploy (Worker)

**Target repo layout:**

```
/web                      Next.js 15 App Router frontend
  /app                    App Router pages
  /components             Reusable React components
  /lib
    /api
      vlp-client.ts       Read-only VLP API client (no write functions)
/workers                  Cloudflare Worker
  /src
    index.js              Worker entry point
    manifest.js           Route registry (TMP_API_ROUTES)
    handlers.js           Route handler dispatch
    storage.js            Write pipeline and R2/D1 utilities
    validate.js           Contract validation (created in Phase 1)
/contracts                Canonical Worker contracts (tmp.*.v1.json)
/migrations               D1 migration SQL files (0001–0016 sequential)
/app                      HTML source pages (design reference, retained until
                          React replacement is built per phase plan)
/site                     HTML marketing pages (design reference)
CHATGPT_CONTEXT.md        This file
ROUTES.md                 Flat Worker route list
STORAGE.md                R2 and D1 path map
CONTRACTS.md              Contract coverage table
DECISIONS.md              Closed architectural decisions
PHASES.md                 Locked migration phase plan
INTEGRATIONS.md           Third-party integration specs
README.md                 Platform overview and build state
```

---

## PART 3 — ARCHITECTURE RULES (never violate)

1.  Contracts are authoritative — never modify a contract without explicit instruction.
2.  Write pipeline order: receipt R2 → canonical R2 → D1 projection.
    Violating this order corrupts the authoritative record.
3.  TMP does not write VLP-owned records — reads only via vlp-client.ts.
4.  Worker CORS is locked to taxmonitor.pro and app.taxmonitor.pro.
    No other origin may call the Worker API.
5.  Session via tmp_session HttpOnly cookie only.
    Cookie: Secure; SameSite=Lax; Domain=.taxmonitor.pro; Path=/
    No Bearer token auth. No localStorage session storage.
6.  All billing subscription writes go through VLP Worker routes.
    TMP calls Stripe only for: checkout session creation, checkout status polling,
    and webhook receipt. It does not call Stripe Subscriptions API directly.
7.  Frontend pages submit exactly what the contract expects — no invented fields.
8.  R2 is always authoritative; D1 is always a projection.
    Never treat D1 as the canonical source for any record.
9.  Document content is never stored in D1 — metadata only; content in R2 encrypted.
10. Phase 11 (document storage) must be deployed before Phase 12 (compliance reports).
    No live document delivery before storage controls exist.
11. Cal.com OAuth uses two separate registered apps (CAL_APP / CAL_PRO). [Q1]
    They have separate client IDs, client secrets, and redirect URIs.
12. Tax professionals authenticate to TMP with independent TMP credentials. [Q3]
    Not federated from VLP. Not SSO-linked to VLP sessions.
13. SSO (OIDC + SAML) is required for launch. Not a post-launch feature. [Q7]
    All four SSO routes must be fully implemented in Phase 3.

---

## PART 4 — CANONICAL ID FORMATS

All IDs are globally unique, generated at creation, and immutable once assigned.
No ID is ever recycled or reassigned.

```
account_id        = ACCT_{UUID}     — taxpayer or taxpro account
inquiry_id        = INQ_{UUID}      — taxpayer inquiry record
session_id        = SES_{UUID}      — intake session (multi-step flow)
event_id          = EVT_{UUID}      — write receipt event identifier
ticket_id         = TKT_{UUID}      — support ticket
membership_id     = MEM_{UUID}      — taxpayer membership subscription
message_id        = MSG_{UUID}      — email message
document_id       = DOC_{UUID}      — uploaded document
poa_id            = POA_{UUID}      — POA Form 2848 record
report_id         = RPT_{UUID}      — compliance report
notification_id   = NTF_{UUID}      — in-app notification
survey_id         = SRV_{UUID}      — exit survey response
job_id            = JOB_{UUID}      — background job (future use)
```

Account role field differentiates taxpayers from tax professionals:
  role: 'taxpayer' | 'taxpro'

Role is set at account creation and cannot be changed via the API.
Role 'taxpro' grants access to tax professional routes (Phase 15+).

---

## PART 5 — MEMBERSHIP TIERS

TMP plan tiers: Free | Essential ($9/mo) | Plus ($19/mo) | Premier ($39/mo)

Annual pricing discounts are applied at Stripe price ID level:
  Essential yearly: $5.40/mo billed annually
  Plus yearly:      $11.40/mo billed annually
  Premier yearly:   $23.40/mo billed annually

Token grants per plan (tax tool tokens = game tokens for TTTMP):

```
Plan       Monthly Price  Yearly Price  Tax Tool Tokens  Transcript Tokens
Free       $0             N/A           0                0
Essential  $9             $5.40/mo      5                2
Plus       $19            $11.40/mo     15               5
Premier    $39            $23.40/mo     40               10
```

Token grants are defined in wrangler.toml:
  TMP_PLAN_FREE_TAX_TOOL_TOKENS        = "0"
  TMP_PLAN_FREE_TRANSCRIPT_TOKENS      = "0"
  TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS   = "5"
  TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS = "2"
  TMP_PLAN_PLUS_TAX_TOOL_TOKENS        = "15"
  TMP_PLAN_PLUS_TRANSCRIPT_TOKENS      = "5"
  TMP_PLAN_PREMIER_TAX_TOOL_TOKENS     = "40"
  TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS   = "10"

Billing operations:
  - Free membership creation:    POST /v1/taxpayer-memberships/free (TMP Worker)
  - Checkout session initiation: POST /v1/checkout/sessions (TMP Worker → Stripe)
  - Checkout status polling:     GET /v1/checkout/status (TMP Worker → Stripe)
  - Stripe webhook receipt:      POST /v1/webhooks/stripe (TMP Worker projects to D1)
  - Subscription create/update/cancel: through VLP API routes (TMP does NOT call
    Stripe Subscriptions API directly — billing writes are VLP-owned)

---

## PART 6 — CONTRACT RULES

- All canonical Worker contracts live in /contracts/ as tmp.*.v1.json
- Two formats exist: canonical (7 required keys) and legacy (stub format)

**Canonical format** — 7 required keys:
  auth       — authentication requirements
  contract   — contract metadata (path, title, governs, usedOnPages)
  delivery   — endpoint, method, receiptKeyPattern
  effects    — writeOrder, canonicalUpsert, canonicalPatch, receiptAppend
  payload    — JSON Schema for request body
  response   — success/error/deduped response shapes
  schema     — name and version

**Legacy format** — stub format with empty fields:
  Keys: contract_version, domain, notes, request, response, storage
  Legacy contracts must be upgraded to canonical format before their D1
  projections can run. Upgrade happens in the phase that implements the route.

**Contract naming convention:**
  tmp.{domain}.{action}.v1.json
  Examples: tmp.inquiry.create.v1.json, tmp.auth.google.start.v1.json

**TMP must NOT have contracts for VLP-governed records:**
  - billing_customers, billing_invoices, billing_payment_intents
  - billing_payment_methods, billing_setup_intents, billing_subscriptions
  - professional profiles, VLP account records
  - VLP-owned token ledger entries

**Contract upgrade queue:**
  Legacy contracts must be upgraded in the phase that implements their route.
  See CONTRACTS.md for the full upgrade queue grouped by phase.

**Frontend rule:**
  Frontend pages submit exactly the contract payload — no invented fields.
  If the contract does not define a field, the frontend must not send it.

---

## PART 7 — WRITE PIPELINE

Every mutation follows this exact order. Deviating from this order is a critical bug.

```
Step 1: Request received at Worker
Step 2: Contract validation
        — load contract from R2 or bundled JSON
        — validate method, path, auth, payload against contract schema
        — if invalid: return 400/401/403 immediately (deny by default)
Step 3: Receipt written to R2
        — path: receipts/tmp/{domain}/{eventId}.json
        — captures raw request body, method, params, query, receivedAt
Step 4: Canonical R2 object updated
        — upsert to canonical path (e.g., inquiries/{inquiryId}.json)
        — R2 is now authoritative for this record
Step 5: D1 index updated via runProjections()
        — D1 table rows are projections of R2 canonical data
        — D1 failure does NOT roll back R2 write
Step 6: Response returned to client
```

R2 is authoritative. D1 is a projection. If D1 and R2 disagree, R2 wins.
Projection repair: re-run projections from R2 receipts to rebuild D1.

The executeWritePipeline() function in workers/src/storage.js implements steps 3–5.
The writeOrder array in contract.effects controls which steps run and in what order.

---

## PART 8 — SESSION DISCIPLINE FOR AI ASSISTANTS

When working on TMP in an AI-assisted development session:

1. **One file or route group per prompt.** Do not batch multiple files into one prompt.
2. **Confirm reads first.** Before writing any code, confirm which files were read.
3. **Never invent.** Do not invent routes, IDs, field names, or contracts not in these docs.
4. **After each output, copy locally** before requesting the next chunk.
5. **Context reset** if the session degrades or output becomes inconsistent.

**Context reset prompt template:**

```
CONTEXT RESET — rules for this session:
Platform: TMP (Tax Monitor Pro)
Task: [specific file or route group]
TMP does NOT write VLP-owned records.
Write pipeline: receipt R2 → canonical R2 → D1
Contracts are repo-local and authoritative.
Deny-by-default routing. Session via tmp_session cookie only.
Read CHATGPT_CONTEXT.md and relevant reference files before continuing.
```

6. **Deny-by-default:** Unmatched routes return 404. Unknown contract keys are rejected.
7. **Check Decision docs first.** Before implementing any auth, Cal.com, or storage
   feature, check DECISIONS.md to ensure closed decisions are not re-opened.

---

## PART 9 — LIVE ENVIRONMENT

```
TMP Frontend:       https://taxmonitor.pro
TMP App:            https://app.taxmonitor.pro
TMP Worker API:     https://api.taxmonitor.pro
VLP Worker API:     https://api.virtuallaunch.pro   (read proxy target for vlp-client.ts)
TMP D1 database:    taxmonitor-pro-d1               (id: set after wrangler d1 create)
TMP R2 bucket:      taxmonitor-pro
Worker name:        taxmonitor-pro-api
Worker route:       api.taxmonitor.pro/*
Zone:               taxmonitor.pro
```

**Cal.com OAuth redirect URIs:**
```
CAL_APP redirect: https://api.taxmonitor.pro/v1/cal/app/oauth/callback
CAL_PRO redirect: https://api.taxmonitor.pro/v1/cal/pro/oauth/callback
```

NOTE: wrangler.toml currently has these redirect URIs missing the /v1/ prefix:
  CAL_APP_OAUTH_REDIRECT_URI = "https://api.taxmonitor.pro/cal/app/oauth/callback"
  CAL_PRO_OAUTH_REDIRECT_URI = "https://api.taxmonitor.pro/cal/pro/oauth/callback"
This must be corrected in Phase 5 when Cal.com routes are implemented. The correct
paths include /v1/ to match the Worker routing convention.

**wrangler.toml gaps to address in Phase 1:**
  - D1 binding not yet present (add [[d1_databases]] block)
  - TMP_DIRECTORY_JSON var absent (add as empty string for local dev seed)
  - VLP_API_BASE_URL var absent (add in Phase 4)

**wrangler.toml gaps to address in Phase 3 (SSO SAML):**
  - SSO_SAML_IDP_ENTITY_ID not present (add to [vars])
  - SSO_SAML_IDP_SSO_URL not present (add to [vars])
  - SSO_SAML_IDP_CERT not present (add as wrangler secret)

**wrangler.toml gaps to address in Phase 4 (VLP sync):**
  - VLP_WEBHOOK_SECRET not in secrets list (add)
  - VLP_API_BASE_URL not in [vars] (add)

**Cal.com client ID gap [Q1]:**
  wrangler.toml currently shows CAL_APP_OAUTH_CLIENT_ID and CAL_PRO_OAUTH_CLIENT_ID
  with the same value. Phase 5 must register two separate Cal.com OAuth apps and
  update both client IDs and secrets to distinct values.

---

## PART 10 — WRANGLER.TOML REFERENCE (non-secret vars, current state)

The following vars are defined in workers/wrangler.toml as of the Phase 0 baseline.
Do not invent var names not on this list. New vars are added in the phase noted.

**App:**
  APP_BASE_URL                    = "https://api.taxmonitor.pro"
  COOKIE_DOMAIN                   = ".taxmonitor.pro"
  ENVIRONMENT                     = "production"
  MAGIC_LINK_EXPIRATION_MINUTES   = "15"
  SESSION_TTL_SECONDS             = "86400"

**Auth:**
  GOOGLE_CLIENT_ID                = ""  (set before Phase 3)
  GOOGLE_REDIRECT_URI             = "https://api.taxmonitor.pro/v1/auth/google/callback"
  SSO_OIDC_CLIENT_ID              = ""
  SSO_OIDC_ISSUER                 = ""
  SSO_OIDC_REDIRECT_URI           = "https://api.taxmonitor.pro/v1/auth/sso/oidc/callback"
  SSO_SAML_ACS_URL                = "https://api.taxmonitor.pro/v1/auth/sso/saml/acs"
  SSO_SAML_ENTITY_ID              = ""
  SSO_SAML_IDP_METADATA_URL       = ""
  TWOFA_TOKEN_EXPIRY_SECONDS      = "300"
  TWOFA_TOTP_ISSUER               = "TaxMonitorPro"

**Billing (Stripe):**
  STRIPE_PUBLISHABLE_KEY                  = ""
  STRIPE_TMP_PRICE_FREE_MONTHLY           = "price_1TB2XMQEa4WBi79g9MrIQ8sE"
  STRIPE_TMP_PRICE_ESSENTIAL_MONTHLY      = "price_1TB2g5QEa4WBi79gzBFxy2se"
  STRIPE_TMP_PRICE_ESSENTIAL_YEARLY       = "price_1TB2g5QEa4WBi79ghK9W4dCI"
  STRIPE_TMP_PRICE_PLUS_MONTHLY           = "price_1TB2k2QEa4WBi79g3hyGQ5Cp"
  STRIPE_TMP_PRICE_PLUS_YEARLY            = "price_1TB2kxQEa4WBi79gQ62yKXvQ"
  STRIPE_TMP_PRICE_PREMIER_MONTHLY        = "price_1TB2t8QEa4WBi79g3qhzDYMZ"
  STRIPE_TMP_PRICE_PREMIER_YEARLY         = "price_1TB2t8QEa4WBi79gQwOSRGsb"
  STRIPE_TMP_PRODUCT_FREE                 = "prod_U9LDhnUUoaV82l"
  STRIPE_TMP_PRODUCT_ESSENTIAL            = "prod_U9LM3whygrnrY0"
  STRIPE_TMP_PRODUCT_PLUS                 = "prod_U9LQhYkDTaATna"
  STRIPE_TMP_PRODUCT_PREMIER              = "prod_U9LakGL5MJfj1x"
  TMP_PLAN_FREE_TAX_TOOL_TOKENS           = "0"
  TMP_PLAN_FREE_TRANSCRIPT_TOKENS         = "0"
  TMP_PLAN_ESSENTIAL_MONTHLY_PRICE        = "9"
  TMP_PLAN_ESSENTIAL_YEARLY_PRICE         = "5.4"
  TMP_PLAN_ESSENTIAL_TAX_TOOL_TOKENS      = "5"
  TMP_PLAN_ESSENTIAL_TRANSCRIPT_TOKENS    = "2"
  TMP_PLAN_PLUS_MONTHLY_PRICE             = "19"
  TMP_PLAN_PLUS_YEARLY_PRICE              = "11.4"
  TMP_PLAN_PLUS_TAX_TOOL_TOKENS           = "15"
  TMP_PLAN_PLUS_TRANSCRIPT_TOKENS         = "5"
  TMP_PLAN_PREMIER_MONTHLY_PRICE          = "39"
  TMP_PLAN_PREMIER_YEARLY_PRICE           = "23.4"
  TMP_PLAN_PREMIER_TAX_TOOL_TOKENS        = "40"
  TMP_PLAN_PREMIER_TRANSCRIPT_TOKENS      = "10"

**Calendar (Cal.com):**
  CAL_APP_OAUTH_AUTHORIZE_URL     = "https://app.cal.com/auth/oauth2/authorize"
  CAL_APP_OAUTH_CLIENT_ID         = "d6839d7dccd5a878d6c5e26b52effd2ab6d241dc047ed2786f9f56de039ca7f3"
  CAL_APP_OAUTH_REDIRECT_URI      = "https://api.taxmonitor.pro/cal/app/oauth/callback"
  CAL_APP_OAUTH_TOKEN_URL         = "https://api.cal.com/v2/auth/oauth2/token"
  CAL_PRO_OAUTH_AUTHORIZE_URL     = "https://app.cal.com/auth/oauth2/authorize"
  CAL_PRO_OAUTH_CLIENT_ID         = "d6839d7dccd5a878d6c5e26b52effd2ab6d241dc047ed2786f9f56de039ca7f3"
  CAL_PRO_OAUTH_REDIRECT_URI      = "https://api.taxmonitor.pro/cal/pro/oauth/callback"
  CAL_PRO_OAUTH_TOKEN_URL         = "https://api.cal.com/v2/auth/oauth2/token"
  (NOTE: Both client IDs are the same — must be split into two registered apps in Phase 5 [Q1])
  (NOTE: Both redirect URIs are missing /v1/ — must be corrected in Phase 5)

**Messaging:**
  GOOGLE_CLIENT_EMAIL             = "tax-monitor-worker@tax-monitor-pro.iam.gserviceaccount.com"
  GOOGLE_TOKEN_URI                = "https://oauth2.googleapis.com/token"
  GOOGLE_WORKSPACE_USER_INFO      = "info@taxmonitor.pro"
  GOOGLE_WORKSPACE_USER_NO_REPLY  = "no-reply@taxmonitor.pro"
  GOOGLE_WORKSPACE_USER_SUPPORT   = "support@taxmonitor.pro"
  TWILIO_ACCOUNT_SID              = ""
  TWILIO_PHONE_NUMBER             = ""
  TWILIO_VERIFY_SERVICE_SID       = ""

**Organization:**
  MY_ORGANIZATION_ADDRESS         = "1175 Avocado Avenue Suite 101 PMB 1010"
  MY_ORGANIZATION_BUSINESS_LOGO   = "https://taxmonitor.pro/assets/logo.svg"
  MY_ORGANIZATION_CITY            = "El Cajon"
  MY_ORGANIZATION_NAME            = "Tax Monitor Pro"
  MY_ORGANIZATION_STATE_PROVINCE  = "CA"
  MY_ORGANIZATION_ZIP             = "92020"

**Secrets (set via `wrangler secret put` — never committed):**
  ENCRYPTION_KEY         — AES-256-GCM key for document/token encryption
  GOOGLE_CLIENT_SECRET   — Google OAuth client secret
  JWT_SECRET             — JWT signing key (TTMP handoff tokens)
  SESSION_SECRET         — tmp_session cookie signing key
  SSO_OIDC_CLIENT_SECRET — OIDC provider client secret
  TWOFA_ENCRYPTION_KEY   — 2FA recovery code encryption key
  STRIPE_SECRET_KEY      — Stripe secret key
  STRIPE_WEBHOOK_SECRET  — Stripe webhook signature verification
  CAL_APP_OAUTH_CLIENT_SECRET — Cal App OAuth client secret
  CAL_PRO_OAUTH_CLIENT_SECRET — Cal Pro OAuth client secret
  CAL_WEBHOOK_SECRET     — Cal.com webhook signature verification
  GOOGLE_PRIVATE_KEY     — Google service account private key (Gmail API)
  TWILIO_AUTH_TOKEN      — Twilio REST API auth token
  TWILIO_WEBHOOK_SECRET  — Twilio webhook signature verification

**Secrets to be added (by phase):**
  Phase 4:  VLP_WEBHOOK_SECRET   — VLP → TMP directory sync webhook secret [Q5]
  Phase 3:  SSO_SAML_IDP_CERT    — SAML IdP certificate [Q7]

---

## PART 11 — CURRENT BUILD STATE (Phase 0 Baseline)

**What is live and working:**
  - R2 read/write (getJson, putJson, listByField, listByPrefix)
  - executeWritePipeline (receipt + canonical upsert)
  - GET /health → 200
  - GET /v1/taxpayer-accounts/{id} → R2 read
  - PATCH /v1/taxpayer-accounts/{id} → executeWritePipeline
  - GET /v1/inquiries/{id} → R2 read
  - GET /v1/inquiries/by-account/{id} → R2 listByField
  - POST /v1/inquiries → executeWritePipeline (canonical only, no D1 projection)
  - GET /v1/taxpayer-memberships/{id} → R2 read
  - GET /v1/taxpayer-memberships/by-account/{id} → R2 listByField
  - POST /v1/taxpayer-memberships/free → executeWritePipeline
  - PATCH /v1/taxpayer-memberships/{id} → R2 read + putJson
  - GET /v1/pricing → returns plan data from wrangler.toml vars
  - GET /v1/checkout/status → proxies to Stripe API
  - POST /v1/checkout/sessions → creates Stripe Checkout Session
  - POST /v1/webhooks/stripe → verifies signature + projects membership to R2
  - POST /v1/webhooks/google-email → appends receipt
  - POST /v1/webhooks/twilio → appends receipt
  - GET /v1/auth/session → reads x-account-id header (stub, no real session)
  - POST /v1/auth/logout → clears session (stub, returns loggedOut: true)
  - GET /v1/auth/2fa/status/{id} → R2 read
  - POST /v1/auth/2fa/disable → R2 update
  - POST /v1/auth/2fa/enroll/init → R2 update (stores pending TOTP)
  - POST /v1/auth/2fa/enroll/verify → R2 update (activates TOTP)
  - GET /v1/notifications/preferences/{id} → R2 read
  - PATCH /v1/notifications/preferences/{id} → R2 merge
  - GET /v1/notifications/in-app → R2 listByField
  - POST /v1/notifications/in-app → R2 putJson
  - GET /v1/support/tickets/{id} → R2 read
  - GET /v1/support/tickets/by-account/{id} → R2 listByField
  - POST /v1/support/tickets → R2 putJson
  - PATCH /v1/support/tickets/{id} → R2 read + putJson
  - GET /v1/directory/professionals → TMP_DIRECTORY_JSON env var (stub)
  - GET /v1/directory/professionals/{id} → TMP_DIRECTORY_JSON env var (stub)
  - GET /v1/email/messages/{id} → R2 read
  - GET /v1/email/messages/by-account/{id} → R2 listByField

**What returns 501 notImplemented (stub handlers):**
  - GET /v1/auth/google/start
  - GET /v1/auth/google/callback
  - POST /v1/auth/magic-link/request
  - GET /v1/auth/magic-link/verify
  - GET /v1/auth/sso/oidc/start
  - GET /v1/auth/sso/oidc/callback
  - GET /v1/auth/sso/saml/start
  - POST /v1/auth/sso/saml/acs
  - POST /v1/email/send
  - POST /v1/notifications/sms/send
  - POST /v1/auth/2fa/challenge/verify

**What is MISSING from manifest (contract file absent):**
  - tmp.notifications.sms.send.v1.json — route exists in manifest, file does not exist

**What is NOT yet in manifest (planned for future phases):**
  - All Cal.com OAuth routes (Phase 5)
  - POST /v1/webhooks/vlp-directory (Phase 4)
  - POST /v1/exit-survey (Phase 9)
  - All document routes (Phase 11)
  - All compliance-report routes (Phase 12)
  - All POA routes (Phase 13)
  - POST /v1/transcripts/request (Phase 13)
  - PATCH /v1/taxpayer-accounts/{id}/filing-status (Phase 9)

**D1 binding:** NOT YET PRESENT in wrangler.toml. Phase 1 adds [[d1_databases]] block.
All executeWritePipeline D1 projection steps currently return { ok: true, skipped: true }.
