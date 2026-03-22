# TMP Architectural Decisions
# Platform: Tax Monitor Pro (TMP)
# Last updated: 2026-03-18 (corrections applied — monitoring engagement model)
#
# All decisions below are CLOSED. Do not re-open these questions in a session.
# If you believe a decision needs revision, surface it explicitly to the user
# with the decision ID and the specific change requested.
#
# Total closed decisions: 12 (Q1–Q12)

---

## HOW TO READ THIS DOCUMENT

Each decision has:
  - A decision ID (Q1–Q11)
  - The question that was open
  - The decision that was made (CLOSED)
  - The rationale
  - The implementation requirements derived from the decision

Do not treat these as open questions. The decisions are final for the current platform version.

---

## Q1 — Cal.com OAuth App Registration

**Question:** Should TMP use one shared Cal.com OAuth app or two separate registered apps
for the taxpayer booking flow and the tax professional calendar management flow?

**Decision: TWO SEPARATE REGISTERED OAUTH APPS. CLOSED.**

  CAL_APP — taxpayer booking flow
    client_id:    CAL_APP_OAUTH_CLIENT_ID (must be unique — see gap note below)
    client_secret: CAL_APP_OAUTH_CLIENT_SECRET (wrangler secret)
    redirect_uri:  https://api.taxmonitor.pro/v1/cal/app/oauth/callback

  CAL_PRO — tax professional calendar management
    client_id:    CAL_PRO_OAUTH_CLIENT_ID (must be unique — see gap note below)
    client_secret: CAL_PRO_OAUTH_CLIENT_SECRET (wrangler secret)
    redirect_uri:  https://api.taxmonitor.pro/v1/cal/pro/oauth/callback

**Rationale:**
  Taxpayer booking and tax professional calendar management are distinct permission scopes
  and distinct user journeys. A single OAuth app would create ambiguity in token scope,
  user consent context, and redirect routing. Separate apps prevent scope bleed.

**Implementation requirements:**
  1. Phase 5: Register two distinct Cal.com OAuth apps and obtain separate client IDs.
  2. Phase 5: Update wrangler.toml — CAL_APP_OAUTH_CLIENT_ID and CAL_PRO_OAUTH_CLIENT_ID
     currently share the same value. Must be corrected to distinct registered IDs.
  3. Phase 5: Correct redirect URIs in wrangler.toml — both are missing /v1/ prefix.
     Current (incorrect): https://api.taxmonitor.pro/cal/app/oauth/callback
     Correct:             https://api.taxmonitor.pro/v1/cal/app/oauth/callback
  4. Cal.com OAuth tokens stored encrypted in D1 tmp_cal_tokens (AES-256-GCM).
     token_ciphertext column — never returned raw in API responses.
  5. app_type ENUM in tmp_cal_tokens: 'cal_app' | 'cal_pro' distinguishes token sets.

**Gaps as of Phase 0:**
  - Both client IDs are the same in wrangler.toml (placeholder) — fix in Phase 5.
  - Both redirect URIs are missing /v1/ in wrangler.toml — fix in Phase 5.
  - CAL_APP_OAUTH_CLIENT_SECRET and CAL_PRO_OAUTH_CLIENT_SECRET must be set via
    `wrangler secret put` once registered apps exist.

---

## Q2 — Cal.com Booking Flow Scope

**Question:** What is the scope of TMP's Cal.com booking integration — read-only
calendar display, or full bidirectional booking creation and management?

**Decision: BIDIRECTIONAL — LIST AND CREATE BOOKINGS. CLOSED.**

TMP implements:
  GET  /v1/cal/bookings   — list bookings for account (calls Cal.com API via stored token)
  POST /v1/cal/bookings   — create booking (calls Cal.com API via stored token)
  GET  /v1/cal/profile    — get Cal.com profile for account

**Rationale:**
  The core use case is connecting taxpayers with tax professionals for scheduled
  consultations. Read-only display without creation defeats the purpose. Full CRUD
  (edit, cancel, reschedule) is deferred to a later phase; create is the minimum viable scope.

**Implementation requirements:**
  1. Phase 5: Implement all three routes above (depends on Q1 OAuth being wired first).
  2. Cal.com Webhooks: Cal.com can push booking events to TMP. Webhook route TBD.
     If implemented, add to Phase 5 or Phase 6. Signed with CAL_WEBHOOK_SECRET.
  3. The POST /v1/cal/bookings handler reads the account's stored Cal.com OAuth token
     from tmp_cal_tokens, decrypts it, and proxies the booking creation to Cal.com API.
  4. TMP does not store booking records in R2 or D1 — bookings live in Cal.com.
     TMP may cache booking metadata for display if latency requires it (decide in Phase 5).

---

## Q3 — Tax Professional Authentication Model

**Question:** How do tax professionals (taxpro role) authenticate to TMP?
Options considered:
  a. Federated from VLP — TMP accepts VLP sessions or tokens
  b. SSO-linked — TMP and VLP share identity provider
  c. Independent TMP credentials — tax pros have their own TMP accounts

**Decision: INDEPENDENT TMP CREDENTIALS. CLOSED.**

Tax professionals authenticate to TMP using TMP-native credentials.
  - TMP role: 'taxpro'
  - Auth methods available: magic link, Google OAuth, SSO (same as taxpayers)
  - NOT federated from VLP
  - NOT SSO-linked to VLP sessions
  - A VLP professional has a separate account on TMP with role 'taxpro'

**Rationale:**
  VLP is the canonical owner of professional profiles. TMP is the discovery and
  matching layer. The two platforms have distinct session lifecycles, user journeys,
  and security boundaries. Federating auth would create cross-platform session
  coupling that makes each platform's security model dependent on the other.
  Independent credentials maintain clean blast radius separation.

**Implementation requirements:**
  1. The account_id format is identical for both roles: ACCT_{UUID}
  2. Role field in tmp_taxpayer_accounts: 'taxpayer' | 'taxpro'
     Role is set at account creation and cannot be changed via the API.
  3. Role 'taxpro' grants access to tax professional routes (Phase 15+).
  4. VLP professional directory sync (Phase 4) associates a VLP professional_id
     with a TMP account_id via the vlp_professionals_cache D1 table.
     This association links their VLP profile to their TMP account without federating auth.
  5. Tax pros must register a TMP account separately from their VLP account.
     Account creation flow is the same as taxpayers (Phase 3 auth routes).

---

## Q4 — Exit Survey Trigger

**Question:** When should TMP prompt a taxpayer with an exit survey — and what is
the minimum implementation scope for the exit survey feature?

**Decision: TRIGGER ON MEMBERSHIP CANCELLATION. MINIMAL SCOPE. CLOSED.**

  Trigger: When a taxpayer cancels a paid membership (Essential, Plus, or Premier)
  Timing:  Survey is shown post-cancellation confirmation, before redirect
  Data collected: reason (enum), feedback (free text, optional), rating (1–5, optional)

**Rationale:**
  Exit surveys on cancellation have the highest signal value because the user is
  making an active negative decision. Triggering at other points (inactivity, page exit)
  introduces noise and is more invasive. Minimal scope prevents over-engineering a
  data collection feature that does not affect core platform functionality.

**Implementation requirements:**
  1. Phase 9: POST /v1/exit-survey (tmp.exit-survey.submit.v1.json)
  2. D1 migration: 0016_create_tmp_exit_surveys.sql (Phase 9)
  3. R2 canonical: /r2/tmp_exit_surveys/{survey_id}.json
  4. Survey submission is optional — cancellation completes regardless of whether
     survey is submitted. The survey must not block cancellation flow.
  5. Reason enum (define in contract): pricing, found_alternative, not_useful,
     technical_issues, temporary_pause, other
  6. Survey data is TMP-owned — never synced to VLP.

---

## Q5 — Professional Directory Sync Model

**Question:** How does TMP keep its professional directory in sync with VLP's
canonical professional profile records?

**Decision: VLP PUSHES TO TMP VIA SIGNED WEBHOOK. TMP CACHES IN D1. CLOSED.**

  Direction:  VLP → TMP (push, not pull)
  Mechanism:  VLP sends a signed POST to /v1/webhooks/vlp-directory on TMP
  Signature:  HMAC-SHA256 signed with VLP_WEBHOOK_SECRET (shared secret)
  TMP action: Upserts to vlp_professionals_cache D1 table on receipt
  TMP reads:  GET /v1/directory/professionals reads from vlp_professionals_cache D1
              GET /v1/directory/professionals/{id} reads from vlp_professionals_cache D1

**Rationale:**
  TMP must never directly read from VLP R2 paths at query time — that creates
  cross-platform latency coupling. A push-based sync with a local D1 cache keeps
  directory reads fast and isolates TMP from VLP availability. VLP controls the
  source of truth and pushes updates as professional profiles change.

**Implementation requirements:**
  1. Phase 4: POST /v1/webhooks/vlp-directory (tmp.webhooks.vlp-directory.v1.json)
  2. Phase 4: Add VLP_WEBHOOK_SECRET to wrangler.toml secrets
  3. Phase 4: Add VLP_API_BASE_URL to wrangler.toml [vars]
  4. Phase 4: Wire GET /v1/directory/professionals to vlp_professionals_cache D1
     (currently reads TMP_DIRECTORY_JSON env var — Phase 4 replaces this)
  5. TMP never writes professional profiles back to VLP. Cache is one-directional.
  6. vlp-client.ts (read-only VLP API client) is used only for on-demand reads
     where cached data is insufficient — not for directory search queries.
  7. vlp_professionals_cache D1 table: migration 0007_create_vlp_professionals_cache.sql
     Columns: professional_id (PK), display_name, specialty, city, state, status,
              raw_json (TEXT), cached_at, updated_at

---

## Q6 — Document Storage Controls

**Question:** What storage and security controls apply to taxpayer-uploaded documents
(Form 2848, supporting documents, profile photos)?

**Decision: ENCRYPTED AT REST IN R2. METADATA ONLY IN D1. ACCOUNT-SCOPED PATHS. AUDIT LOGGED. CLOSED.**

Controls that apply to all documents stored by TMP:
  1. Content encrypted at rest: AES-256-GCM using ENCRYPTION_KEY secret before R2 write
  2. IV generated per-object, stored alongside ciphertext in the .enc file
  3. Stored at account-scoped R2 path: /r2/tmp_documents/{account_id}/{document_id}.enc
  4. D1 metadata only: tmp_documents table stores filename, mimeType, sizeBytes, r2_key
     — D1 never stores document content
  5. Audit logged: every upload, access, and deletion event written to tmp_activity
  6. Access gated: Worker validates account_id matches session before issuing path
  7. Documents never returned as raw bytes in API responses — presigned URL or decrypt-on-read

These same controls apply to:
  - General documents (POST /v1/documents/upload/*)
  - Scanned Form 2848 (wet-signed path — Phase 13)
  - Transcript files uploaded by tax pro (/r2/tmp_transcripts/{account_id}/{document_id}.enc)
  - Compliance reports (/r2/tmp_compliance_reports/{account_id}/{report_id}.json — encrypted)

**Rationale:**
  Documents contain taxpayer PII and sensitive financial records. Encryption at rest
  is required. Storing content in D1 would violate Rule #9 (document content never in D1).
  Account-scoped paths prevent cross-account data access via path traversal. Audit logging
  satisfies compliance and incident response requirements.

**Implementation requirements:**
  1. Phase 11: All document routes (6 contracts, see CONTRACTS.md Section 15)
  2. Phase 11 must deploy before Phase 12 (compliance reports)
  3. Phase 13 transcript upload uses same controls as Phase 11
  4. ENCRYPTION_KEY must be set via `wrangler secret put` before Phase 11 deploys
  5. Profile photo stored at /r2/tmp_documents/{account_id}/profile-photo.{ext} (encrypted)

---

## Q7 — SSO Launch Requirement

**Question:** Is SSO (OIDC + SAML) a required launch feature or a post-launch addition?

**Decision: SSO IS REQUIRED FOR LAUNCH. ALL FOUR SSO ROUTES IN PHASE 3. CLOSED.**

  Required routes (all Phase 3):
    GET /v1/auth/sso/oidc/start      — OIDC authorization redirect
    GET /v1/auth/sso/oidc/callback   — OIDC token exchange + account upsert
    GET /v1/auth/sso/saml/start      — SAML AuthnRequest generation + redirect
    POST /v1/auth/sso/saml/acs       — SAML assertion consumer + account upsert

  Both OIDC and SAML must be fully functional in Phase 3.
  Both are currently stub (501 notImplemented) as of Phase 0.

**Rationale:**
  TMP serves tax professionals operating within enterprise and organizational contexts.
  SSO is not optional for these buyers — organizations require SSO for user provisioning,
  audit, and access control. Launching without SSO means the platform cannot be adopted
  by the professional segment that creates the most directory value.

**Implementation requirements:**
  1. Phase 3: Implement all four SSO routes
  2. wrangler.toml vars to add in Phase 3:
       SSO_SAML_IDP_ENTITY_ID       (IdP entity identifier)
       SSO_SAML_IDP_SSO_URL         (IdP SSO service URL for AuthnRequest)
  3. wrangler.toml secrets to add in Phase 3:
       SSO_SAML_IDP_CERT            (SAML IdP certificate for assertion verification)
  4. Existing wrangler.toml vars (already present — verify values before Phase 3):
       SSO_OIDC_CLIENT_ID           = "" (set before Phase 3)
       SSO_OIDC_ISSUER              = "" (set before Phase 3)
       SSO_OIDC_REDIRECT_URI        = "https://api.taxmonitor.pro/v1/auth/sso/oidc/callback"
       SSO_SAML_ACS_URL             = "https://api.taxmonitor.pro/v1/auth/sso/saml/acs"
       SSO_SAML_ENTITY_ID           = "" (set before Phase 3)
       SSO_SAML_IDP_METADATA_URL    = "" (set before Phase 3)
  5. Secrets already present (verify values before Phase 3):
       SSO_OIDC_CLIENT_SECRET       — OIDC provider client secret

---

## Q8 — Engagement Assignment Model

**Question:** How does a tax professional get assigned to an open monitoring engagement?
Options considered:
  a. Admin assigns manually
  b. Automatic matching algorithm (by specialty, location, availability)
  c. Tax pro self-claims from an open engagement pool

**Decision: TAX PRO SELF-CLAIMS FROM AN OPEN ENGAGEMENT POOL. CLOSED.**

Any verified taxpro account (role: 'taxpro', status: 'active') can claim any open engagement.
No specialty matching. No state/location constraint. First valid claim wins.

**Rationale:**
  Admin assignment creates a bottleneck and requires operational overhead before the
  platform has enough tax pros to be selective. Automated matching requires quality signals
  (ratings, specialty data, past performance) that don't exist at launch. Self-claim is the
  lowest-friction model that gets engagements moving without platform-side gatekeeping.
  Constraints can be added in a later phase once matching signal quality is established.

**Implementation requirements:**
  1. Phase 15: New route POST /v1/engagements/{engagement_id}/claim
       - Caller must have role: 'taxpro' AND status: 'active'
       - Engagement must have status: 'pending' AND professional_id: null
       - On success: sets professional_id = caller's account_id, status → 'active'
       - Updates R2 canonical engagement record + D1 tmp_monitoring_engagements
       - Writes audit event to tmp_activity:
           { action: 'engagement_claimed', resource_type: 'engagement',
             resource_id: engagement_id, actor_id: caller's account_id }
  2. Phase 15: New route GET /v1/engagements/open
       - Returns list of engagements where status: 'pending' AND professional_id: null
       - Accessible only to verified taxpro accounts
       - Reads from D1 tmp_monitoring_engagements (index query on status + professional_id)
  3. New contracts (Phase 15):
       tmp.engagement.claim.v1.json        — POST /v1/engagements/{engagement_id}/claim
       tmp.engagement.list-open.v1.json    — GET /v1/engagements/open
  4. 'Verified taxpro' definition:
       account exists in tmp_taxpayer_accounts with role: 'taxpro' AND status: 'active'
       No additional verification step required at this time.
       Future phases may add professional credential verification.
  5. Race condition handling:
       If two tax pros attempt to claim the same engagement simultaneously, the first
       successful D1 write wins. The second must receive a 409 Conflict response.
       The handler must use a conditional D1 update (WHERE professional_id IS NULL)
       to ensure atomic claim semantics.

---

## Q9 — Engagement Completion Trigger

**Question:** What triggers a monitoring engagement to be marked complete?
  For Bronze/Silver/Gold term plans: when does plan_end get enforced?
  For Snapshot plans: when does the engagement close after the second report?

**Decision: CLOUDFLARE CRON TRIGGER, DAILY AT 09:00 UTC. ONE UNIFIED HANDLER. CLOSED.**

All plan types (Bronze/Silver/Gold term-end AND Snapshot plan_end) are handled by a
single scheduled handler on the TMP Worker, triggered daily by Cloudflare Cron.

**Rationale:**
  Webhook-based completion (e.g., triggered by report delivery) creates coupling between
  Phase 12 (compliance reports) and Phase 9 (engagement lifecycle). A scheduled handler
  is simpler to reason about, idempotent by design, and decouples the completion check
  from individual events. Daily at 09:00 UTC is an acceptable delay given that monitoring
  engagements operate on week-long timeframes, not minute-level precision.

**Implementation requirements:**
  1. Phase 9: Add [triggers] section to wrangler.toml:
       [triggers]
       crons = ["0 9 * * *"]
  2. Phase 9: Add scheduled handler in workers/src/index.js:
       export default {
         fetch(request, env, ctx) { ... },
         async scheduled(event, env, ctx) { ... }
       }
       Scheduled handler logic:
         a. Query D1: SELECT * FROM tmp_monitoring_engagements
                      WHERE status = 'active' AND plan_end IS NOT NULL
                      AND plan_end <= date('now')
         b. For each matching engagement:
              i.   Set status = 'complete' in D1 tmp_monitoring_engagements
              ii.  Update R2 canonical: /r2/tmp_monitoring_engagements/{engagement_id}.json
              iii. Write audit event to D1 tmp_activity:
                     { action: 'engagement_completed', resource_type: 'engagement',
                       resource_id: engagement_id, actor_id: 'system' }
              iv.  For Bronze/Silver/Gold (stripe_subscription_id is not null):
                     Call VLP API via vlp-client.ts to cancel the Stripe subscription.
                     TMP does NOT call Stripe directly — billing writes are VLP-owned.
  3. plan_end calculation for term plans (set at engagement creation in Phase 9):
       Bronze:  plan_start + 42 days  (6 weeks)
       Silver:  plan_start + 56 days  (8 weeks)
       Gold:    plan_start + 84 days  (12 weeks)
       plan_start is set when checkout.session.completed webhook creates the engagement record.
  4. Snapshot plan_end logic:
       Snapshot engagements are created with plan_end: null (term_weeks = 0)
       plan_end is set by Phase 12 compliance report handler when the SECOND compliance
       report is delivered for that engagement_id:
         POST /v1/compliance-reports handler must:
           a. Count existing reports for the engagement: SELECT COUNT(*) FROM
              tmp_compliance_reports WHERE engagement_id = ?
           b. If count reaches 2: set engagement plan_end = date('now') in D1 + R2
       Until plan_end is set, Snapshot engagements have plan_end = null and are NOT
       picked up by the Cron handler.
  5. Stripe subscription cancellation:
       When the Cron handler marks a Bronze/Silver/Gold engagement complete, it must
       cancel the corresponding Stripe subscription via VLP API routes.
       This is the only case where the Cron handler makes an outbound API call.
       Failure to cancel must be retried — log to tmp_activity with action: 'subscription_cancel_failed'.

---

## Q10 — Transcript Token Scope

**Question:** Do TMP_PLAN_*_TRANSCRIPT_TOKENS govern transcript uploads within a
monitoring engagement, or do they serve a different purpose?

**Decision: MONITORING ENGAGEMENT INCLUDES UNLIMITED UPLOADS. TRANSCRIPT TOKENS ARE FOR TTMP ONLY. CLOSED.**

Monitoring engagement (Bronze/Silver/Gold/Snapshot) grants unlimited transcript uploads
for the duration of the plan term. No token tracking, no balance, no decrement.

TMP_PLAN_*_TRANSCRIPT_TOKENS are awarded to platform membership holders (Essential/Plus/Premier)
for use with TTMP (the separate transcript tool platform). They have nothing to do with
monitoring engagement transcript uploads.

**Rationale:**
  Transcript uploads within a monitoring engagement are a core deliverable of the plan —
  constraining them with a token balance would degrade the product and add operational
  complexity (what if a taxpayer has many transcript types, or needs reupload?).
  The existing transcript token vars exist for the TTMP integration context, where they
  represent access credits to a separate tool platform with its own pricing model.
  Conflating the two creates confusion about what the plan includes.

**Implementation requirements:**
  1. TMP_PLAN_*_TRANSCRIPT_TOKENS vars retain their current values in wrangler.toml.
     Their meaning is:
       Platform membership transcript tokens → awarded to Essential/Plus/Premier members
       for use with TTMP (the transcript tool platform — separate from TMP monitoring).
  2. POST /v1/transcripts/upload/init does NOT check any token balance.
     The only constraints on transcript uploads within an engagement are:
       a. Active engagement record exists (status: 'active')
       b. POA (Form 2848) on file for the account/professional pair
       c. Caller has role: 'taxpro' AND is the assigned professional_id
  3. CHATGPT_CONTEXT.md Part 5 must be updated when next edited to clarify:
       "Platform membership transcript tokens: awarded to members for TTMP use.
        Monitoring engagement transcripts: unlimited within the plan term, no token cost."
  4. Phase 10 (Token Redemption) governs TTMP transcript token redemption — not Phase 13.
     Phase 13 (transcript upload) has no dependency on Phase 10.

---

## Q11 — Transcript Upload Mechanism

**Question:** How does a tax pro upload a transcript file to TMP?
Options considered:
  a. Worker proxy — tax pro POSTs bytes to TMP Worker, Worker re-uploads to R2
  b. Presigned R2 URL — Worker generates a time-limited URL, tax pro uploads directly to R2

**Decision: PRESIGNED R2 URL. TAX PRO CLIENT ENCRYPTS BEFORE UPLOAD. CLOSED.**

Worker generates a presigned R2 PUT URL. Tax pro client encrypts the file before uploading
directly to R2. Worker never touches the file bytes.

**Rationale:**
  A Worker proxy approach means all transcript bytes flow through the Worker, consuming
  CPU time and egress. Cloudflare Workers have a 128 MB request body limit (128 MB on
  paid plans) which may be insufficient for large transcript sets. A presigned URL allows
  the client to stream directly to R2 without Worker involvement. The trade-off is that
  the Worker cannot enforce encryption on bytes it never sees — this is accepted and
  documented as a policy-enforced limitation.

**Implementation requirements:**
  1. Phase 13: POST /v1/transcripts/upload/init response shape:
       {
         "upload_url":  "https://taxmonitor-pro.r2.cloudflarestorage.com/...",
         "document_id": "DOC_{UUID}",
         "expires_at":  "{ISO timestamp — 15 minutes from generation}"
       }
  2. Presigned URL generation:
       - Use Cloudflare R2 presigned URL API (AWS S3-compatible presigned PUT)
       - R2 key: tmp_transcripts/{account_id}/{document_id}.enc
       - Expiry: 15 minutes (matching MAGIC_LINK_EXPIRATION_MINUTES convention)
       - HTTP method: PUT
       - Content-Type: application/octet-stream
       - Generated via R2_BUCKET.createPresignedUrl() or equivalent Workers R2 SDK call
  3. Encryption responsibility:
       - The tax pro CLIENT must encrypt the transcript file (AES-256-GCM) BEFORE
         uploading to the presigned URL.
       - The Worker cannot encrypt bytes in-flight because it never sees them.
       - The Worker CANNOT verify AES encryption of an opaque blob at upload-complete.
       - Encryption is enforced by policy. This limitation must be documented in
         security review before Phase 13 ships.
       - The key used for encryption must be agreed upon out-of-band between the tax
         pro client and TMP. The ENCRYPTION_KEY secret is the designated key.
  4. Phase 13: POST /v1/transcripts/upload/complete:
       - Worker verifies the file exists at R2 key tmp_transcripts/{account_id}/{document_id}.enc
         (confirms the presigned PUT was used — file is present)
       - Writes metadata to D1 tmp_documents
       - Writes audit event to D1 tmp_activity
       - Returns { ok: true, document_id }
  5. wrangler.toml: No new vars required. R2 presigned URL uses R2_BUCKET binding
     already present. Presigned URL generation does not require additional secrets.

---

## Q12 — Next.js Version

**Question:** Which version of Next.js should be used for the TMP frontend scaffold?

**Decision: UPGRADE TO NEXT.JS 16.2.0+. CLOSED.**

  web/package.json next version set to ^16.2.0.
  eslint-config-next updated to match: ^16.2.0.

**Rationale:**
  Three moderate CVEs (GHSA-9g9p-9gw9-jx7f, GHSA-3x4c-7xq6-9pq8,
  GHSA-ggv3-7p47-pfv8) affect Next.js 9.5.0–16.1.6. Upgrading before
  Phase 3 component work begins avoids patching a codebase with existing
  React components.

**Implementation requirements:**
  1. web/package.json next version: ^16.2.0
  2. eslint-config-next: ^16.2.0 (added to devDependencies)
  3. react and react-dom remain at ^19.0.0 (compatible with Next.js 16)
  4. Owner runs: cd web && npm install && npm audit to confirm vulnerabilities resolved.

Phase: Phase 2 (applied during scaffold cleanup).

---

## DECISIONS NOT REOPENED BY 2026-03-18 CORRECTIONS

Q8–Q11 (2026-03-18) address the four open questions identified after the monitoring
engagement model correction. They do not reopen any of Q1–Q7.

The monitoring engagement model correction (IRS/Transcript Handoff section) does NOT
reopen any of Q1–Q7. The correction:
  - Removes the TTMP JWT handoff model (was not a closed decision — was an open design spec)
  - Replaces it with a tax pro manual upload model
  - Adds Phase 9 monitoring plan checkout and Phase 13 transcript upload routes
  - Does not affect Cal.com, SSO, auth, directory sync, or document storage decisions

The JWT_SECRET wrangler secret remains in the secrets list. Its use case is now:
  - Magic link token signing/verification (Phase 3)
  - Any other internal JWT use that may arise in later phases
  It is NO LONGER used for TTMP transcript handoff tokens (that model is removed).
