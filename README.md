# README.md

# Tax Monitor Pro

**Serverless · Contract-Driven · Idempotent · Event-Driven**

---

## Table of Contents (Alphabetical)

* Authentication Model
* ClickUp Projection Layer
* Contracts (Source of Truth)
* Core Stack
* Data Model (R2 Canonical Authority)
* Domains & Routing
* Event Trigger System
* Idempotency & Safety
* Operational Checklist
* Processing Contract (Write Order)
* Repository Structure (Exact Tree)
* Security & Legal Controls
* Staff Compliance Records Gate
* System Architecture
* What Tax Monitor Pro Is
* 2848 Two-Signature Sequence
* Worker Environment Variables

---

# What Tax Monitor Pro Is

Tax Monitor Pro is a **serverless CRM + delivery system for tax monitoring services**.

It is:

* Contract-driven
* Event-driven
* Idempotent
* R2-authoritative
* Worker-orchestrated

HTML never defines valid data.
JSON contracts define valid data.

---

# System Architecture

### Presentation Layer

Cloudflare Pages serves:

* `/app/*`
* `/site/*`

### Logic Layer

Cloudflare Worker:

* Validates inbound events
* Writes append-only receipts
* Upserts canonical state
* Projects to ClickUp
* Sends email (after canonical update only)

### Storage Layer

Cloudflare R2:

* Canonical objects
* Append-only receipt ledger

### Execution Layer

ClickUp:

* Accounts list
* Orders list
* Support list

ClickUp is projection only.
R2 is authority.

---

# Domains & Routing

### UI Domain

`https://taxmonitor.pro`

Serves:

* `/app/*`
* `/site/*`

### API Domain

`https://api.taxmonitor.pro`

Worker Route:

```
api.taxmonitor.pro/*
```

**All forms must POST to absolute URLs.**
No relative form actions allowed.

---

# Authentication Model

Supported:

* Google OAuth
* Magic Link
* SSO (SAML / OIDC)

### Endpoints (Alphabetical)

```
GET  /auth/google/callback
GET  /auth/session
POST /auth/google
POST /auth/logout
POST /auth/magic-link/request
POST /auth/magic-link/verify
POST /auth/sso/callback
POST /auth/sso/init
```

### Login Processing

All login events:

1. Write login receipt
2. Upsert canonical account
3. Update `lastLoginAt`
4. Issue HTTP-only secure cookie

Stored in:

```
accounts/{accountId}.json
```

```json
auth: {
  provider,
  lastLoginAt,
  lastActiveAt
}
```

---

# Event Trigger System

### Final Trigger Set (Alphabetical)

* Appt
* Email
* Form
* Login
* Message
* Payment
* Task
* Visit

### Trigger Sources

Appt → Cal.com webhook
Email → Google Workspace (post-canonical only)
Form → Portal + staff submissions
Login → Auth endpoints
Message → In-app + logged outbound
Payment → Stripe webhook
Task → ClickUp webhook
Visit → Client-side beacon

### Processing Flow

Worker → Receipt → Canonical Upsert → ClickUp Projection → Optional Email

---

# Processing Contract (Write Order)

For every inbound event:

1. Validate signature (if webhook)
2. Validate payload against contract
3. Write append-only receipt
4. Upsert canonical object
5. Update ClickUp (projection layer)
6. Send email (if required)

If receipt exists → exit safely.

---

# Data Model (R2 Canonical Authority)

```
accounts/{accountId}.json
orders/{orderId}.json
support/{supportId}.json
receipts/{source}/{eventId}.json
```

Receipts are immutable ledger entries.
Canonical objects are mutable state.

---

# Contracts (Source of Truth)

All workflows are governed by versioned JSON contracts.

Validation Rules:

* enumStrict = true
* normalizeCheckboxToBoolean = true
* rejectUnknownValues = true
* No hardcoded dropdown enums in HTML
* No business logic inferred from UI

Contracts are enforced by the Worker.

---

# ClickUp Projection Layer

### List IDs

* Accounts — 901710909567
* Orders — 901710818340
* Support — 901710818377

ClickUp is never authoritative.
Worker writes canonical state first, then projects.

---

# Idempotency & Safety

* Every event must include `eventId`
* Stripe dedupe key = Stripe Session ID
* Cal dedupe key = Cal event ID
* Receipt written before canonical change
* No duplicate tasks
* No duplicate emails
* Retry-safe processing

---

# Staff Compliance Records Gate

Endpoint:

```
POST https://api.taxmonitor.pro/forms/staff/compliance-records
```

Validates against:

```
app/contracts/staff/compliance-records.contract.json
```

On final submission:

* `complianceSubmitted = true`
* `reportReady = true`

ClickUp status updated to:

`10 Compliance Records`

---

# 2848 Two-Signature Sequence

Both signatures occur on Page 2.

Sequence:

1. Generate Page 1 + Page 2
2. Taxpayer signs Page 2
3. Representative signs Page 2
4. Store final signed PDF in R2

Canonical fields:

* `esign2848Status` (draft | taxpayer_signed | fully_signed)
* `esign2848TaxpayerSignedAt`
* `esign2848RepresentativeSignedAt`
* `esign2848UrlTaxpayerSignedPdf`
* `esign2848UrlFinalPdf`

---

# Security & Legal Controls

* Deny-by-default endpoints
* Webhook signature validation (Stripe + Cal)
* No secrets in client payloads
* No raw SSN logging
* PII masked in UI
* R2 is authority
* ClickUp is projection only

---

# Core Stack (Alphabetical)

* Cal.com — Appointment webhooks
* ClickUp — Execution layer (projection only)
* Cloudflare Pages — UI hosting
* Cloudflare R2 — Canonical storage + receipt ledger
* Cloudflare Worker — API orchestration + validation
* Google Workspace — Transactional email (only permitted system)
* Stripe — Payment webhooks

---

# Worker Environment Variables

### Secrets

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* GOOGLE_PRIVATE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

### Plaintext

* CLICKUP_ACCOUNTS_LIST_ID = 901710909567
* CLICKUP_ORDERS_LIST_ID = 901710818340
* CLICKUP_SUPPORT_LIST_ID = 901710818377
* GOOGLE_CLIENT_EMAIL
* GOOGLE_TOKEN_URI
* GOOGLE_WORKSPACE_USER_INFO
* GOOGLE_WORKSPACE_USER_NO_REPLY
* GOOGLE_WORKSPACE_USER_SUPPORT
* MY_ORGANIZATION_ADDRESS
* MY_ORGANIZATION_BUSINESS_LOGO
* MY_ORGANIZATION_CITY
* MY_ORGANIZATION_NAME
* MY_ORGANIZATION_STATE_PROVINCE
* MY_ORGANIZATION_ZIP

---

# Operational Checklist

* All forms POST to absolute Worker URLs
* Every event includes `eventId`
* Receipt written before state change
* Canonical upsert before ClickUp update
* Emails sent only after canonical update
* Contracts versioned and enforced
* Login writes receipt
* 2848 state machine enforced

---

# Repository Structure (Exact Tree)

**This structure is authoritative and must not be modified without updating this file.**

(Keep your full tree block exactly as you had it — it’s correct and canonical.)

---

## What Changed

* Removed duplicated architectural statements
* Consolidated processing flow into one authoritative section
* Moved environment variables into their own clean block
* Removed narrative drift

* Eliminated layered repetition
