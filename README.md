# Tax Monitor Pro (TMP)

## Overview

Tax Monitor Pro (TMP) is the taxpayer discovery and membership platform within the Virtual Launch Pro (VLP) ecosystem. It connects taxpayers seeking tax help with licensed tax professionals, and provides structured entry into VLP tax services. TMP serves two user types: **taxpayers** (individuals seeking tax assistance) and **taxpros** (tax professionals listed in the TMP directory). TMP owns its own R2 and D1 data, reads VLP-owned records via a read-only client, and never writes to VLP-governed paths.

---

## Current Build State

### Phase Status

| Phase | Name | Status | Key Deliverable |
|-------|------|--------|-----------------|
| 0 | Baseline | COMPLETE | R2 read/write, Worker routing, core handlers live |
| 1 | Foundation | COMPLETE | D1 binding, contract validation, local dev vars |
| 2 | D1 Schema | IN PROGRESS | Apply migrations 0001–0015, enable D1 projections, entitlements read stub |
| 3 | Authentication | NOT STARTED | Real session (tmp_session cookie), Google OAuth, Magic Link, SSO OIDC+SAML |
| 4 | VLP Directory Sync | NOT STARTED | VLP webhook → vlp_professionals_cache D1 |
| 5 | Cal.com Integration | NOT STARTED | Cal.com OAuth (2 apps), booking create/list |
| 6 | Intake Sessions | NOT STARTED | Multi-step intake session state persistence |
| 7 | Messaging | NOT STARTED | Gmail API (email send), Twilio SMS, fix missing SMS contract |
| 8 | Search + Filtering | NOT STARTED | Extended directory search, filter params |
| 9 | Billing + Monitoring Checkout | NOT STARTED | Monitoring engagement checkout, entitlements grants, cron trigger |
| 10 | Token Redemption | NOT STARTED | TTTMP tax tool token redemption integration |
| 11 | Document Storage | NOT STARTED | Encrypted document upload/retrieval (must precede Phase 12) |
| 12 | Compliance Reports | NOT STARTED | Tax pro report delivery to taxpayer accounts |
| 13 | POA + Transcript Upload | NOT STARTED | Form 2848 POA, presigned R2 transcript upload |
| 14 | 2FA Challenge Verify | NOT STARTED | Real TOTP verification |
| 15 | Tax Pro Routes | NOT STARTED | Tax pro account routes, engagement claim pool |
| 16 | Tax Pro Dashboard + VLP Deep Sync | NOT STARTED | Full tax pro operational experience |

### Live Worker Routes

| Category | Count |
|---|---|
| In manifest (live handlers) | 33 |
| In manifest (stub handlers — 501) | 11 |
| In manifest (missing contract file) | 1 |
| **Total in manifest** | **45** |
| Planned (not yet in manifest) | 28 |
| **Total surface (current + planned)** | **73** |

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + Tailwind CSS 4 |
| Cloudflare adapter | @opennextjs/cloudflare (OpenNext — diverges from VLP which uses deprecated @cloudflare/next-on-pages) |
| Backend | Cloudflare Worker (workers/src/index.js) |
| Database | Cloudflare D1 (binding: DB, database: taxmonitor-pro-d1) |
| Storage | Cloudflare R2 (binding: R2_BUCKET, bucket: taxmonitor-pro) |
| Auth | HttpOnly cookie (tmp_session), Google OAuth, Magic Link, SSO (OIDC + SAML) |
| Billing | Stripe (checkout sessions + webhook); subscription writes via VLP |
| Booking | Cal.com — two separate registered OAuth apps (CAL_APP / CAL_PRO) |

### Live URLs

| Environment | URL |
|---|---|
| Frontend | https://taxmonitor.pro |
| App | https://app.taxmonitor.pro |
| Worker API | https://api.taxmonitor.pro |

---

## Product Lines

### 1. Platform Memberships (recurring)

Monthly or annual subscription granting access to the TMP platform and token grants.

| Plan | Monthly | Yearly | Tax Tool Tokens | Transcript Tokens |
|---|---|---|---|---|
| Free | $0 | N/A | 0 | 0 |
| Essential | $9 | $5.40/mo | 5 | 2 |
| Plus | $19 | $11.40/mo | 15 | 5 |
| Premier | $39 | $23.40/mo | 40 | 10 |

- Tax tool tokens are redeemed at TTTMP (separate game/tool platform — TMP does not host it)
- Transcript tokens are for TTMP use (separate transcript tool — not the same as monitoring engagement uploads)
- Billing subscription writes go through VLP API routes — TMP does not call Stripe Subscriptions API directly

### 2. Tax Monitoring Engagements (separate purchase)

One-time or term-based purchase for active tax monitoring by an assigned tax professional.

| Plan | Price | Term | Type |
|---|---|---|---|
| Bronze | $275 | 6 weeks | Recurring Stripe subscription |
| Silver | $325 | 8 weeks | Recurring Stripe subscription (most popular) |
| Gold | $425 | 12 weeks | Recurring Stripe subscription |
| Snapshot | $299 | One-time | Single payment (initial pull + one update) |
| MFJ Add-On | +$79 | Per spouse | Applies to any term plan |

- Engagement records created in D1 `tmp_monitoring_engagements` and R2 on checkout completion
- Tax pro self-claims engagements from an open pool (Phase 15, [Q8])
- Engagement completion handled by daily Cron Trigger at 09:00 UTC (Phase 9, [Q9])

---

## Architecture

### Write Pipeline

Every mutation follows this exact order. Deviating is a critical bug.

```
Step 1: Request received at Worker
Step 2: Contract validation
        — load contract from R2 or bundled JSON
        — validate method, path, auth, payload against contract schema
        — if invalid: return 400/401/403 immediately (deny by default)
Step 3: Receipt written to R2
        — path: receipts/tmp/{domain}/{eventId}.json
        — permanent append-only audit trail; never deleted
Step 4: Canonical R2 object updated
        — upsert to canonical path (e.g., tmp_entitlements/{accountId}.json)
        — R2 is now authoritative for this record
Step 5: D1 index updated via runProjections()
        — D1 table rows are projections of R2 canonical data
        — D1 failure does NOT roll back R2 write
Step 6: Response returned to client
```

### Ownership Rules

**TMP owns (writes to):**
- `taxpayer_accounts/{account_id}.json`
- `taxpayer_memberships/{membership_id}.json`
- `inquiries/{inquiry_id}.json`
- `tmp_entitlements/{account_id}.json`
- `tmp_exit_surveys/{survey_id}.json`
- `tmp_monitoring_engagements/{engagement_id}.json`
- `tmp_documents/{account_id}/{document_id}.*`
- `tmp_transcripts/{account_id}/{document_id}.enc`
- `tmp_poa_records/{account_id}/{poa_id}.json`
- `tmp_compliance_reports/{account_id}/{report_id}.json`
- `receipts/tmp/{domain}/{event_id}.json` (write receipts — all mutations)

**VLP owns (TMP reads via vlp-client.ts — NEVER writes):**
- `/r2/professionals/{professional_id}.json`
- `/r2/billing_customers/{account_id}.json`
- `/r2/billing_subscriptions/{membership_id}.json`
- `/r2/memberships/{membership_id}.json`
- `/r2/tokens/{account_id}.json`

**The rule that overrides everything:** TMP does not write to VLP-owned canonical records.

### D1 Tables

All 18 D1 tables are projections of R2 canonical data. R2 is always authoritative.

| Table | Description |
|---|---|
| tmp_taxpayer_accounts | Taxpayer and taxpro account index |
| tmp_memberships | Platform membership subscriptions |
| tmp_inquiries | Taxpayer service request records |
| tmp_intake_sessions | Multi-step intake session state |
| tmp_activity | Append-only audit trail for all PII-touching events |
| tmp_preferences | Notification preference settings per account |
| vlp_professionals_cache | Read-only VLP professional directory cache (synced via webhook) |
| tmp_cal_tokens | Cal.com OAuth tokens — AES-256-GCM encrypted at rest |
| tmp_documents | Document metadata only (no content in D1) |
| tmp_poa_records | Form 2848 POA records (CAF number in R2 only, never D1) |
| tmp_compliance_reports | Compliance report metadata (encrypted content in R2 only) |
| tmp_support_tickets | TMP support ticket index |
| tmp_notifications | In-app notification index |
| tmp_email_messages | Outbound email message index |
| tmp_magic_link_tokens | Pending magic link tokens (SHA-256 hashed, TTL 15 min) |
| tmp_exit_surveys | Membership cancellation exit survey responses |
| tmp_monitoring_engagements | Tax monitoring engagement records (bronze/silver/gold/snapshot) |
| tmp_entitlements | Token balance and plan entitlements per account |

---

## Reference Files

| File | Purpose |
|---|---|
| CHATGPT_CONTEXT.md | Master context — read at the start of every TMP development session |
| ROUTES.md | Flat Worker route list with manifest status, handler status, and contract file |
| STORAGE.md | R2 path map and D1 table reference; canonical vs. projection distinction |
| CONTRACTS.md | Contract coverage table — all 75 contracts (on disk, missing, and planned) |
| DECISIONS.md | 11 closed architectural decisions (Q1–Q11) — do not reopen without explicit instruction |
| PHASES.md | Locked migration phase plan (Phases 0–16) with deliverables and migration reference |
| INTEGRATIONS.md | Third-party integration specs (Stripe, Cal.com, Twilio, Gmail, TTMP, TTTMP) |

---

## Closed Architectural Decisions

All 11 decisions are closed. Do not reopen without explicit instruction. See DECISIONS.md for full detail.

| ID | Decision |
|---|---|
| Q1 | Cal.com uses two separate registered OAuth apps (CAL_APP / CAL_PRO) — distinct client IDs, secrets, redirect URIs |
| Q2 | Cal.com booking scope is bidirectional: list and create bookings (not read-only) |
| Q3 | Tax professionals authenticate with independent TMP credentials — not federated from VLP |
| Q4 | Exit survey triggers on membership cancellation only; submission is optional and never blocks cancellation |
| Q5 | VLP pushes professional directory updates to TMP via signed webhook; TMP caches in D1 vlp_professionals_cache |
| Q6 | Document content encrypted at rest (AES-256-GCM) in R2; D1 stores metadata only; access is audit-logged |
| Q7 | SSO (OIDC + SAML) is required for launch — all four SSO routes must be live in Phase 3 |
| Q8 | Tax pros self-claim open engagements from a shared pool; first valid claim wins; no specialty/location matching |
| Q9 | Engagement completion triggered by daily Cloudflare Cron at 09:00 UTC; single unified scheduled handler |
| Q10 | Monitoring engagement transcript uploads are unlimited within the plan term; TMP_PLAN_*_TRANSCRIPT_TOKENS are for TTMP only |
| Q11 | Transcript upload uses presigned R2 PUT URL; tax pro client encrypts before upload; Worker never touches file bytes |

---

## Development

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- Wrangler CLI authenticated to Cloudflare (`wrangler login`)
- npm workspaces (root `package.json` manages `web` and `workers`)

### Setup

```bash
npm install
```

### Run Worker locally

```bash
npm run dev:worker
```

### Run Next.js locally

```bash
npm run dev:web
```

### Deploy Worker

```bash
npm run deploy:worker
```

### Build for Cloudflare Pages

```bash
npm run build:web:cf
```

This runs `npx opennextjs-cloudflare build` in the `web` workspace. The standard `npm run build:web` runs `next build` only (without Cloudflare adapter output).

---

## Security Notes

- **Document encryption:** All document content (taxpayer uploads, transcripts, compliance reports, profile photos) is encrypted at rest with AES-256-GCM using `ENCRYPTION_KEY` before write to R2. IV is generated per-object and stored alongside ciphertext.
- **CAF numbers:** CAF numbers (Form 2848) are encrypted in R2 and never stored in D1. They are never returned in any API response, even if stored encrypted.
- **Session security:** Authentication uses HttpOnly `tmp_session` cookie only. No Bearer tokens. No localStorage session storage. Cookie: `Secure; SameSite=Lax; Domain=.taxmonitor.pro; Path=/`.
- **Phase ordering:** Phase 11 (document storage) must be deployed before Phase 12 (compliance reports). No live document delivery before storage controls exist. This is Rule #10 and is non-negotiable.
- **SSO required for launch:** SSO (OIDC + SAML) is a launch requirement, not a post-launch feature (Q7). All four SSO routes must be fully implemented in Phase 3.
- **No VLP writes:** TMP must never write to VLP-owned R2 paths or VLP D1 tables. All billing subscription writes go through VLP API routes.

---

## License

Proprietary — Virtual Launch Pro / Tax Monitor Pro.
Unauthorized redistribution or modification is prohibited.
