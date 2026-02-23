You chose option 2. Good. We’re finishing this properly.

I reviewed your README  and I’m going to give you a **fully corrected, architecturally exhaustive v2** that:

* Adds lifecycle stepBooleans
* Clarifies read models (without polluting registry rules)
* Locks domain enforcement
* Documents artifact storage
* Clarifies report rendering contract
* Keeps your mutation-only contract philosophy intact
* Remains clean and enforceable

This replaces your current README in full.

---

# README.md (Authoritative Spec — v2)

# Tax Monitor Pro

**Serverless · Contract-Driven · Idempotent · Event-Driven · R2-Authoritative**

---

## Table of Contents (Alphabetical)

* 2848 Two-Signature Sequence
* Authentication Model
* ClickUp Projection Layer
* Contracts (Mutation Ingress Only)
* Core Stack
* Data Model (R2 Canonical Authority)
* Domains & Routing
* Event Trigger System
* Idempotency & Safety
* Lifecycle State Model (Order StepBooleans)
* Operational Checklist
* Processing Contract (Write Order)
* Read Models (Worker GET Endpoints)
* Report Rendering Contract
* Repository Structure (Exact Tree)
* Security & Legal Controls
* Staff Compliance Records Gate
* System Architecture
* What Tax Monitor Pro Is
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

## Presentation Layer

Cloudflare Pages serves:

* `/app/*`
* `/site/*`

UI never mutates canonical state directly.
All mutations go through Worker endpoints.

---

## Logic Layer

Cloudflare Worker (`api.taxmonitor.pro`):

* Validates inbound events
* Writes append-only receipts
* Upserts canonical state
* Enforces lifecycle gating
* Projects to ClickUp
* Sends email (after canonical update only)
* Serves read-only GET endpoints

---

## Storage Layer

Cloudflare R2:

* Canonical objects (mutable state)
* Append-only receipt ledger (immutable)
* Generated artifacts (PDFs)

R2 is authority.
Nothing else is authoritative.

---

## Execution Layer

ClickUp:

* Accounts list
* Orders list
* Support list

ClickUp is projection only.
Worker writes to R2 first, then projects.

---

# Domains & Routing

## UI Domain

```
https://taxmonitor.pro
```

Serves:

* `/app/*`
* `/site/*`

---

## API Domain

```
https://api.taxmonitor.pro
```

Worker route:

```
api.taxmonitor.pro/*
```

Rules:

* All forms must POST absolute URLs
* No relative form actions
* No UI → ClickUp direct calls
* No UI → Stripe direct calls
* No SMTP ever

---

# Event Trigger System

## Final Trigger Set (Alphabetical)

* Appt
* Email
* Form
* Login
* Message
* Payment
* Task
* Visit

## Trigger Sources

Appt → Cal webhook
Email → Google Workspace (post-canonical only)
Form → Portal + staff submissions
Login → Auth endpoints
Message → In-app + logged outbound
Payment → Stripe webhook
Task → ClickUp webhook
Visit → Client-side beacon (logged, not client-visible)

---

# Processing Contract (Write Order)

For every inbound event:

1. Validate signature (if webhook)
2. Validate payload against JSON contract
3. Append receipt (immutable)
4. Upsert canonical object
5. Project to ClickUp
6. Send email (if required)

If receipt exists → exit safely.

Receipt append always precedes canonical mutation.

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

# Lifecycle State Model (Order StepBooleans)

Each order tracks progression via strict booleans:

```
intakeComplete
offerAccepted
agreementAccepted
paymentCompleted
welcomeConfirmed
filingStatusSubmitted
addressUpdateSubmitted
esign2848Submitted
complianceSubmitted
reportReady
```

Worker enforces:

* No forward step without prior completion
* No projection before canonical update
* No report rendering unless `reportReady = true`

---

# Report Rendering Contract

Report rendering follows strict priority:

1. orders object (primary)
2. accounts object (secondary)

If `reportReady = false`:

* Render placeholders
* Do not render compliance artifacts

Rendering logic never infers state from UI.

---

# 2848 Two-Signature Sequence

Both signatures occur on Page 2.

Sequence:

1. Generate Page 1 + Page 2
2. Taxpayer signs Page 2
3. Representative signs Page 2
4. Store final signed PDF in R2
5. Update canonical fields
6. Project to ClickUp

Canonical fields:

```
esign2848Status (draft | taxpayer_signed | fully_signed)
esign2848TaxpayerSignedAt
esign2848RepresentativeSignedAt
esign2848UrlTaxpayerSignedPdf
esign2848UrlFinalPdf
```

---

# Staff Compliance Records Gate

Endpoint:

```
POST https://api.taxmonitor.pro/forms/staff/compliance-records
```

On final submission:

* `complianceSubmitted = true`
* `reportReady = true`

ClickUp status updated to:

```
10 Compliance Records
```

Artifact storage:

```
reports/{accountId}/{taxYear}/compliance.pdf
```

Stored in R2.

---

# Read Models (Worker GET Endpoints)

Read models:

* Do not append receipts
* Do not mutate canonical R2
* Do not project to ClickUp
* Are not included in contract-registry.json

Example:

```
GET /app/payments
```

Purpose:

Return Stripe-derived payment data derived from canonical R2 objects.

Read models are documented here, not registered as mutation contracts.

---

# Contracts (Mutation Ingress Only)

Registry file:

```
app/contracts/contract-registry.json
```

Contracts exist only when:

* Endpoint receives POST
* Worker appends receipt
* Worker mutates canonical R2
* Worker updates lifecycle state
* Worker triggers ClickUp projection

Validation rules:

* enumStrict = true
* normalizeCheckboxToBoolean = true
* rejectUnknownValues = true
* No hardcoded dropdown enums in HTML
* No business logic inferred from UI

---

# ClickUp Projection Layer

List IDs:

* Accounts — 901710909567
* Orders — 901710818340
* Support — 901710818377

ClickUp is never authoritative.

---

# Idempotency & Safety

* Every event includes `eventId`
* Stripe dedupe key = Stripe Session ID
* Cal dedupe key = Cal event ID
* Receipt written before canonical change
* No duplicate tasks
* No duplicate emails
* Retry-safe processing

---

# Core Stack (Alphabetical)

* Cal.com — Appointment webhooks
* ClickUp — Projection layer
* Cloudflare Pages — UI hosting
* Cloudflare R2 — Canonical storage + artifacts
* Cloudflare Worker — API orchestration
* Google Workspace — Transactional email
* Stripe — Payment webhooks

---

# Worker Environment Variables

## Secrets

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* GOOGLE_PRIVATE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

## Plaintext

* CLICKUP_ACCOUNTS_LIST_ID
* CLICKUP_ORDERS_LIST_ID
* CLICKUP_SUPPORT_LIST_ID
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

* All forms POST absolute Worker URLs
* Every event includes `eventId`
* Receipt written before state change
* Canonical upsert before ClickUp update
* Emails sent only after canonical update
* Lifecycle booleans strictly enforced
* Login writes receipt
* 2848 state machine enforced
* Read models never mutate state

---

# Final Authority

R2 is authority.
Worker enforces contracts.
ClickUp is projection.
Registry governs mutation ingress only.
Read models are documented in README.

Architecture is locked.