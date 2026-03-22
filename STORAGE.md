# TMP Storage Map
# Platform: Tax Monitor Pro (TMP)
# R2 Bucket: taxmonitor-pro (binding: R2_BUCKET)
# D1 Database: taxmonitor-pro-d1 (binding: DB — added in Phase 1)
# Last updated: Phase 0 (pre-migration baseline)
#
# This platform DOES NOT write to any VLP-owned R2 path.
# This platform DOES NOT write to any VLP-owned D1 table.
# All VLP-owned data is read via vlp-client.ts only.

---

## TMP-Owned R2 Paths (canonical writes)

These paths are owned by TMP. Only the TMP Worker writes to these paths.
R2 is always authoritative. D1 tables are projections of this data.

### Taxpayer Accounts
```
/r2/taxpayer_accounts/{account_id}.json
  — canonical taxpayer account record
  — fields: accountId, email, displayName, phone, role, security, notificationPreferences,
             filingStatus, addressLine1, addressLine2, city, state, zip, createdAt, updatedAt
  — written by: PATCH /v1/taxpayer-accounts/{id}, POST /v1/auth/* (account creation)
  — D1 projection: tmp_taxpayer_accounts
```

### Taxpayer Memberships
```
/r2/taxpayer_memberships/{membership_id}.json
  — canonical taxpayer membership record
  — fields: membershipId, accountId, plan, status, billingPeriod, stripeCustomerId,
             stripeCheckoutSessionId, checkoutCompletedAt, provider, updatedAt
  — written by: POST /v1/taxpayer-memberships/free, POST /v1/webhooks/stripe
  — D1 projection: tmp_memberships
```

### Inquiries
```
/r2/inquiries/{inquiry_id}.json
  — canonical inquiry (taxpayer service request)
  — fields: inquiryId, accountId, email, name, phone, professionalId, message,
             sourcePage, status, eventId, createdAt, updatedAt
  — written by: POST /v1/inquiries
  — D1 projection: tmp_inquiries
```

### Intake Sessions
```
/r2/tmp_intake_sessions/{session_id}.json
  — multi-step intake session state
  — fields: sessionId, accountId, step, data, completedSteps, startedAt, updatedAt
  — written by: intake flow routes (Phase 6)
  — D1 projection: tmp_intake_sessions
```

### Email Messages
```
/r2/email_messages/{message_id}.json
  — outbound email message record
  — fields: messageId, accountId, to, from, subject, body, status, sentAt, createdAt
  — written by: POST /v1/email/send (Phase 7)
  — D1 projection: tmp_email_messages
```

### Support Tickets
```
/r2/support_tickets/{ticket_id}.json
  — TMP support ticket record (TMP-owned; distinct from VLP shared tickets)
  — fields: ticketId, accountId, subject, body, status, priority, createdAt, updatedAt
  — written by: POST /v1/support/tickets, PATCH /v1/support/tickets/{id}
  — D1 projection: tmp_support_tickets
```

### In-App Notifications
```
/r2/notifications_in_app/{notification_id}.json
  — in-app notification record
  — fields: notificationId, accountId, title, body, read, createdAt
  — written by: POST /v1/notifications/in-app
  — D1 projection: tmp_notifications
```

### Exit Surveys [Q4]
```
/r2/tmp_exit_surveys/{survey_id}.json
  — exit survey response record
  — fields: surveyId, accountId, reason, feedback, rating, submittedAt
  — written by: POST /v1/exit-survey (Phase 9)
  — D1 projection: tmp_exit_surveys
  — migration: 0016_create_tmp_exit_surveys.sql
```

### Documents [Phase 11, Q6]
```
/r2/tmp_documents/{account_id}/{document_id}.json
  — document metadata (no content stored in D1)
  — fields: documentId, accountId, filename, mimeType, sizeBytes, uploadedAt, encrypted: true
  — D1 projection: tmp_documents (metadata only)

/r2/tmp_documents/{account_id}/{document_id}.enc
  — encrypted document content (AES-256-GCM)
  — encrypted with ENCRYPTION_KEY secret before write
  — IV stored alongside ciphertext
  — NEVER returned directly in API responses — presigned URL or decrypt-on-read only

/r2/tmp_documents/{account_id}/profile-photo.{ext}
  — encrypted profile photo [Q6]
  — written by: POST /v1/documents/photo/upload/complete (Phase 11)
  — used by: profile page (Phase 7 displays placeholder; Phase 11 serves real photo)
  — consumed by: account profile page, tax pro dashboard (Phase 15)
```

### POA Records [Phase 13]
```
/r2/tmp_poa_records/{account_id}/{poa_id}.json
  — Power of Attorney Form 2848 record
  — fields: poaId, accountId, professionalId, cafNumberCiphertext, signatureType,
             signedAt, status, createdAt
  — cafNumberCiphertext: AES-256-GCM encrypted CAF number (NEVER returned in API)
  — written by: POST /v1/poa (Phase 13)
  — D1 projection: tmp_poa_records
```

### Compliance Reports [Phase 12]
```
/r2/tmp_compliance_reports/{account_id}/{report_id}.json
  — compliance report metadata + encrypted content
  — fields: reportId, accountId, professionalId, type, status, generatedAt, contentEncrypted: true
  — report content is encrypted at rest
  — written by: POST /v1/compliance-reports (Phase 12)
  — D1 projection: tmp_compliance_reports
```

### Entitlements [Phase 9]
```
/r2/tmp_entitlements/{account_id}.json
  — canonical entitlements record
  — fields: accountId, plan, taxToolTokens, transcriptTokens,
             tokensGrantedAt, billingPeriodEnd, updatedAt
  — written by: PATCH /v1/entitlements/{account_id},
                POST /v1/webhooks/stripe (on membership activation, plan change, cancellation)
  — D1 projection: tmp_entitlements
```

### Monitoring Engagements
```
/r2/tmp_monitoring_engagements/{engagement_id}.json
  — canonical monitoring engagement record
  — fields: engagementId, accountId, professionalId, planType,
             termWeeks, mfjAddon, status, stripeSubscriptionId,
             planStart, planEnd, createdAt, updatedAt
  — written by: POST /v1/webhooks/stripe (on monitoring plan checkout),
                POST /v1/engagements/{id}/claim (Phase 15),
                Cron Trigger (on plan_end completion, Phase 9)
  — D1 projection: tmp_monitoring_engagements
  — R2 receipt: /r2/receipts/tmp/monitoring-engagements/{event_id}.json

/r2/tmp_transcripts/{account_id}/{document_id}.enc
  — encrypted transcript file uploaded by tax pro (Phase 13)
  — same document storage controls as Phase 11
  — encrypted AES-256-GCM with ENCRYPTION_KEY
  — account-scoped, audit logged to tmp_activity
  — NEVER returned as raw bytes in API responses
```

### Write Receipts
```
/r2/receipts/tmp/{domain}/{event_id}.json
  — write receipt appended at start of every mutation pipeline
  — fields: body, contractPath, method, params, query, receivedAt, route
  — domain values: inquiries, memberships, accounts, support, notifications,
                   cal, documents, poa, compliance, exit-surveys, webhooks
  — NEVER deleted — permanent append-only audit trail
  — NOT projected to D1 (receipts are archive only)
  — example: receipts/tmp/inquiries/{eventId}.json
```

---

## VLP-Owned R2 Paths (TMP reads via vlp-client.ts — NEVER writes)

TMP reads these paths server-side only. vlp-client.ts has no write functions.
These paths are never called from the browser. CORS on VLP is locked.

```
/r2/professionals/{professional_id}.json   — VLP professional profile
/r2/profiles/{professional_id}.json        — VLP public profile data
/r2/memberships/{membership_id}.json       — VLP shared operational membership record
/r2/tokens/{account_id}.json               — VLP token balance ledger
/r2/billing_customers/{account_id}.json    — VLP billing customer record
/r2/billing_subscriptions/{membership_id}.json  — VLP subscription record
/r2/accounts_vlp/{account_id}.json         — VLP account record
```

NOTE: VLP professional directory is synced to TMP via webhook [Q5] and cached in
D1 table vlp_professionals_cache. TMP directory search reads from D1 cache, not
directly from VLP R2 paths, to avoid cross-platform latency.

---

## TMP D1 Tables (projections — never source of truth)

D1 tables are always projections of R2 canonical data. If D1 and R2 disagree, R2 wins.
Projections can be rebuilt by replaying R2 receipts.

D1 binding: DB (added to wrangler.toml in Phase 1)
D1 database: taxmonitor-pro-d1 (created with `wrangler d1 create taxmonitor-pro-d1`)

```
Table                       Migration File                              Phase
──────────────────────────────────────────────────────────────────────────────
tmp_taxpayer_accounts       0001_create_tmp_taxpayer_accounts.sql       2
tmp_memberships             0002_create_tmp_memberships.sql             2
tmp_inquiries               0003_create_tmp_inquiries.sql               2
tmp_intake_sessions         0004_create_tmp_intake_sessions.sql         2
tmp_activity                0005_create_tmp_activity.sql                2
tmp_preferences             0006_create_tmp_preferences.sql             2
vlp_professionals_cache     0007_create_vlp_professionals_cache.sql     2
tmp_cal_tokens              0008_create_tmp_cal_tokens.sql              2
tmp_documents               0009_create_tmp_documents.sql               2
tmp_poa_records             0010_create_tmp_poa_records.sql             2
tmp_compliance_reports      0011_create_tmp_compliance_reports.sql      2
tmp_support_tickets         0012_create_tmp_support_tickets.sql         2
tmp_notifications           0013_create_tmp_notifications.sql           2
tmp_email_messages          0014_create_tmp_email_messages.sql          2
tmp_magic_link_tokens       0015_create_tmp_magic_link_tokens.sql       2/3
tmp_exit_surveys            0016_create_tmp_exit_surveys.sql            9 [Q4]
tmp_monitoring_engagements  0017_create_tmp_monitoring_engagements.sql  9 [Q8] [Q9]
tmp_entitlements            0018_create_tmp_entitlements.sql            9
```

### Table Descriptions

**tmp_taxpayer_accounts**
  Projection of /r2/taxpayer_accounts/{account_id}.json
  Columns: account_id (PK), email, display_name, role, plan, status, created_at, updated_at
  Indexes: email (UNIQUE), role, status

**tmp_memberships**
  Projection of /r2/taxpayer_memberships/{membership_id}.json
  Columns: membership_id (PK), account_id (FK), plan, billing_period, status,
           stripe_customer_id, stripe_checkout_session_id, created_at, updated_at
  Indexes: account_id, status, plan

**tmp_inquiries**
  Projection of /r2/inquiries/{inquiry_id}.json
  Columns: inquiry_id (PK), account_id, professional_id, email, name, status,
           source_page, created_at, updated_at
  Indexes: account_id, professional_id, status

**tmp_intake_sessions**
  Projection of /r2/tmp_intake_sessions/{session_id}.json
  Columns: session_id (PK), account_id, step, completed_steps, started_at, updated_at
  Indexes: account_id, step

**tmp_activity**
  Audit trail — all PII-touching events (append-only, never update or delete)
  Columns: activity_id (PK), account_id, action, resource_type, resource_id,
           actor_id, ip_address, created_at
  Indexes: account_id, action, created_at

**tmp_preferences**
  Notification preferences projection
  Columns: account_id (PK), in_app (BOOL), sms (BOOL), email (BOOL), updated_at
  Indexes: account_id

**vlp_professionals_cache**
  Read-only VLP professional directory cache. Populated by POST /v1/webhooks/vlp-directory [Q5]
  TMP never writes to VLP R2 from this table — it's a local cache only.
  Columns: professional_id (PK), display_name, specialty, city, state, status,
           raw_json (TEXT), cached_at, updated_at
  Indexes: status, specialty, city

**tmp_cal_tokens**
  Cal.com OAuth tokens — encrypted at rest [Q1]
  Columns: account_id (PK), app_type (ENUM: 'cal_app'|'cal_pro'), token_ciphertext (TEXT),
           token_iv (TEXT), expires_at, updated_at
  Indexes: account_id, app_type
  NOTE: token_ciphertext is AES-256-GCM encrypted with ENCRYPTION_KEY before insert

**tmp_documents**
  Document metadata only — NO content stored in D1 [Phase 11, Q6]
  Columns: document_id (PK), account_id, filename, mime_type, size_bytes,
           r2_key (TEXT), encrypted (BOOL), uploaded_at
  Indexes: account_id

**tmp_poa_records**
  POA Form 2848 records [Phase 13]
  Columns: poa_id (PK), account_id, professional_id, signature_type, status,
           signed_at, created_at
  NOTE: caf_number is stored in R2 only (encrypted) — NOT in D1
  Indexes: account_id, professional_id, status

**tmp_compliance_reports**
  Compliance report metadata [Phase 12]
  Columns: report_id (PK), account_id, professional_id, type, status, generated_at
  NOTE: report content is in R2 only (encrypted) — D1 stores metadata only
  Indexes: account_id, professional_id, status, generated_at

**tmp_support_tickets**
  Support ticket index
  Columns: ticket_id (PK), account_id, subject, status, priority, created_at, updated_at
  Indexes: account_id, status, priority

**tmp_notifications**
  In-app notification index
  Columns: notification_id (PK), account_id, title, read (BOOL), created_at
  Indexes: account_id, read, created_at

**tmp_email_messages**
  Outbound email message index
  Columns: message_id (PK), account_id, subject, status, sent_at, created_at
  Indexes: account_id, status

**tmp_magic_link_tokens**
  Pending magic link tokens (TTL: MAGIC_LINK_EXPIRATION_MINUTES = 15 min)
  Columns: token_hash (PK), account_id, email, expires_at, used (BOOL), created_at
  Indexes: email, expires_at
  NOTE: Tokens are hashed on insert (SHA-256). Raw token is delivered via email only.
        Used tokens are marked used=1, never deleted (audit trail).

**tmp_exit_surveys** [Q4]
  Exit survey responses
  Columns: survey_id (PK), account_id, reason, feedback, rating (INT), submitted_at
  Indexes: account_id, reason, submitted_at
  Migration: 0016_create_tmp_exit_surveys.sql

**tmp_monitoring_engagements** [Q8] [Q9]
  Monitoring engagement index (Bronze/Silver/Gold/Snapshot/MFJ)
  Columns: engagement_id (PK), account_id, professional_id, plan_type, term_weeks,
           mfj_addon (INT/BOOL), status, stripe_subscription_id, plan_start, plan_end,
           created_at, updated_at
  Indexes: account_id, professional_id, status, plan_type
  NOTE: professional_id is null until a tax pro claims the engagement (Phase 15 [Q8])
        stripe_subscription_id is null for Snapshot (one-time payment)
        plan_end is null for Snapshot until second compliance report delivered [Q9]
  R2 canonical: tmp_monitoring_engagements/{engagement_id}.json
  Written by: POST /v1/webhooks/stripe (on monitoring plan checkout),
              POST /v1/engagements/{id}/claim (Phase 15),
              Cron Trigger (on plan_end completion, Phase 9)
  Migration: 0017_create_tmp_monitoring_engagements.sql

**tmp_entitlements** [Phase 9]
  Token balance and plan entitlements per taxpayer account
  Columns: account_id (PK), plan, tax_tool_tokens (INT), transcript_tokens (INT),
           tokens_granted_at (TEXT), billing_period_end (TEXT), updated_at (TEXT)
  NOTE: No additional indexes beyond the primary key.
  R2 canonical: tmp_entitlements/{account_id}.json
  Written by: PATCH /v1/entitlements/{account_id},
              POST /v1/webhooks/stripe (membership activation, plan change, cancellation)
  Migration: 0018_create_tmp_entitlements.sql

---

## Forbidden Writes (TMP must NEVER write to these paths)

Attempting to write to these paths from TMP code is a critical architecture violation.
These records are owned by VLP or other platforms.

```
/r2/professionals/*             ← VLP owns professional profiles
/r2/profiles/*                  ← VLP owns public professional profiles
/r2/billing_customers/*         ← VLP owns billing customer records
/r2/billing_subscriptions/*     ← VLP owns subscription records
/r2/billing_invoices/*          ← VLP owns invoice records
/r2/billing_payment_intents/*   ← VLP owns payment intent records
/r2/billing_payment_methods/*   ← VLP owns payment method records
/r2/billing_setup_intents/*     ← VLP owns setup intent records
/r2/accounts_vlp/*              ← VLP owns VLP account records
/r2/memberships/*               ← VLP owns shared operational memberships
/r2/tokens/*                    ← VLP owns token balance ledger
```

---

## Encryption Requirements

All of the following must be encrypted at rest using AES-256-GCM with ENCRYPTION_KEY
before writing to R2 or D1. The IV is generated per-object and stored alongside
the ciphertext.

| Data                        | Storage Location                                               | Encrypted? |
|-----------------------------|----------------------------------------------------------------|------------|
| Document content            | /r2/tmp_documents/{account_id}/{document_id}.enc               | YES — .enc |
| Profile photo               | /r2/tmp_documents/{account_id}/profile-photo.{ext}             | YES        |
| Cal.com OAuth tokens        | D1 tmp_cal_tokens.token_ciphertext                             | YES        |
| CAF number (POA Form 2848)  | /r2/tmp_poa_records/{account_id}/{poa_id}.json cafNumberCiphertext | YES    |
| Compliance report content   | /r2/tmp_compliance_reports/{account_id}/{report_id}.json       | YES        |
| Magic link tokens           | D1 tmp_magic_link_tokens.token_hash (SHA-256, not reversible)  | Hashed     |

Fields that must NEVER appear in API responses (even if stored encrypted):
  - cafNumber (CAF number in cleartext)
  - token_ciphertext (Cal.com access token)
  - document content (return presigned URL or stream, not raw bytes)

---

## Storage Utility Functions (workers/src/storage.js)

```
getJson(env, key)                    — R2 GET, parses JSON, returns null if not found
putJson(env, key, value)             — R2 PUT, serializes JSON with content-type header
listByField(env, prefix, field, val) — R2 list prefix, filter by field value
listByPrefix(env, prefix)            — R2 list prefix, return all JSON objects
appendReceipt({contract, env, requestContext, route})  — writes receipt to R2
executeWritePipeline({contract, env, requestContext, route})  — steps 3-5 of write pipeline
upsertCanonicalRecord({contract, env, requestContext, route}) — R2 canonical upsert
mergeAccountNotificationPreferences(account, patch)  — merges notification prefs
resolveTemplate(value, requestContext, route)  — resolves {payload.x} template tokens
resolveObject(value, requestContext, route)    — recursive resolveTemplate for objects
```

All R2 keys have leading slashes stripped before use (stripLeadingSlash function).
Store keys without leading slash: `taxpayer_accounts/{account_id}.json`
