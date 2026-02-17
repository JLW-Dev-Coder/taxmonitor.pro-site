# README.md

# Tax Monitor Pro
Serverless · Contract-Driven · Idempotent · Event-Driven
* * *
## Table of Contents (Alphabetical)
*   Authentication Model
*   ClickUp Projection Layer
*   Contracts (Source of Truth)
*   Core Stack
*   Data Model (R2 Canonical Authority)
*   Domains & Routing
*   Event Trigger System
*   Idempotency & Safety
*   Operational Checklist
*   Processing Contract (Write Order)
*   Repository Structure (Exact Tree)
*   Security & Legal Controls
*   Staff Compliance Records Gate
*   System Architecture
*   What Tax Monitor Pro Is
*   2848 Two-Signature Sequence
* * *
# What Tax Monitor Pro Is
Tax Monitor Pro is a **serverless CRM + delivery system for tax monitoring services**.
It is:
*   Contract-driven
*   Idempotent
*   Event-driven
*   Worker-first
*   R2-authoritative
HTML never defines valid data.
JSON contracts define valid data.
* * *
# Core Stack (Alphabetical)
*   [Cal.com](http://Cal.com) — Appointment booking webhooks
*   ClickUp — Human execution layer (projection only)
*   Cloudflare Pages — UI (portal + marketing)
*   Cloudflare R2 — Canonical authority + append-only receipts
*   Cloudflare Worker — API, orchestration, validation
*   Google Workspace — Transactional email (only permitted email system)
*   Stripe — Payment webhooks
* * *
# System Architecture
Presentation Layer
Cloudflare Pages serves:
*   `/app/*`
*   `/site/*`
Logic Layer
Cloudflare Worker:
*   Validates inbound events
*   Writes receipts
*   Upserts canonical objects
*   Projects to ClickUp
*   Sends email (after canonical update only)
Storage Layer
Cloudflare R2:
*   Canonical objects
*   Append-only receipt ledger
Execution Layer
ClickUp:
*   Accounts list
*   Orders list
*   Support list
* * *
# Domains & Routing
UI Domain:

Serves:
*   `/app/*`
*   `/site/*`
API Domain:

Route:

```plain
api.taxmonitor.pro/*
```

All forms must POST to absolute URLs:

No relative form actions allowed.
* * *
# Repository Structure (Exact Tree)
**This structure is authoritative and must not be modified without updating this file.**

```dpr
.
├─ app/
│  ├─ agreement.html
│  ├─ contracts/
│  │  ├─ clickup/
│  │  │  ├─ account.list.contract.json
│  │  │  ├─ orders.list.contract.json
│  │  │  └─ support.list.contract.json
│  │  ├─ forms/
│  │  │  ├─ intake/
│  │  │  │  ├─ agreement.contract.json
│  │  │  │  ├─ intake.contract.json
│  │  │  │  ├─ offer.contract.json
│  │  │  │  └─ payment.contract.json
│  │  │  └─ post-payment/
│  │  │     ├─ welcome.contract.json
│  │  │     ├─ filing-status.contract.json
│  │  │     ├─ address-update.contract.json
│  │  │     ├─ esign-2848.contract.json
│  │  │     ├─ wet-signed-2848.contract.json
│  │  │     ├─ compliance-report.contract.json
│  │  │     └─ client-exit-survey.contract.json
│  │  ├─ staff/
│  │  │  └─ compliance-records.contract.json
│  │  └─ tm_compliance_record.v2.example.json
│  ├─ index.html
│  ├─ intake.html
│  ├─ login.html
│  ├─ offer.html
│  ├─ pages/
│  │  ├─ calendar.html
│  │  ├─ files.html
│  │  ├─ flows/
│  │  │  ├─ intake/
│  │  │  │  ├─ agreement.html
│  │  │  │  ├─ intake.html
│  │  │  │  ├─ offer.html
│  │  │  │  └─ payment.html
│  │  │  └─ post-payment/
│  │  │     ├─ welcome.html
│  │  │     ├─ filing-status.html
│  │  │     ├─ address-update.html
│  │  │     ├─ esign-2848.html
│  │  │     ├─ compliance-report.html
│  │  │     └─ client-exit-survey.html
│  │  ├─ messaging.html
│  │  ├─ office.html
│  │  ├─ projects.html
│  │  ├─ staff/
│  │     └─ compliance-records.html
│  │  └─ support.html
│  ├─ partials/
│  │  ├─ sidebar.html
│  │  └─ topbar.html
│  ├─ payment-success.html
│  └─ payment.html
├─ assets/
│  ├─ favicon.ico
│  └─ logo.svg
├─ legal/
│  ├─ privacy.html
│  └─ terms.html
├─ public/
│  └─ .gitkeep
├─ site/
│  ├─ case-studies.html
│  ├─ contact.html
│  ├─ index.html
│  ├─ partials/
│  │  ├─ footer.html
│  │  └─ header.html
│  ├─ pricing.html
│  ├─ resources/
│  │  └─ 433f.html
│  ├─ site.js
│  └─ support.html
├─ styles/
│  ├─ app.css
│  └─ site.css
└─ workers/
   └─ api/
      ├─ src/
      │  └─ index.js
      └─ wrangler.toml
├─ build.mjs
├─ .gitattributes
├─ .gitignore
├─ README.md
├─ _redirects
```

Rules:
*   All JSON contracts live in `app/contracts/`
*   UI flows live in `app/pages/`
*   Worker code lives in `workers/api/src/`
*   Cloudflare config lives in `workers/api/wrangler.toml`
*   Static assets live in `assets/`
*   Public marketing content lives in `site/`
*   Legal docs live in `legal/`
*   Styles live in `styles/`
*   Remove legacy folders (e.g., dist/) if unused
* * *
# Contracts (Source of Truth)
All workflows are governed by versioned JSON contracts.
Validation Rules:
*   Strict enum enforcement
*   rejectUnknownValues = true
*   normalizeCheckboxToBoolean = true
*   No hardcoded dropdown options in HTML
*   No inferred business logic from UI
Contracts are versioned and enforced by the Worker.
* * *
# Event Trigger System
Final Trigger Set (Alphabetical):
*   Appt
*   Email
*   Form
*   Login
*   Message
*   Payment
*   Task
*   Visit
Trigger Sources:
Appt → [Cal.com](http://Cal.com) webhook
Email → Google Workspace outbound (post-canonical)
Form → All portal + staff submissions
Login → Auth endpoints
Message → In-app + logged outbound
Payment → Stripe webhook
Task → ClickUp webhook
Visit → Client-side beacon
All triggers:
Worker → Receipt → Canonical Upsert → ClickUp Projection → Optional Email
* * *
# Processing Contract (Write Order)
For every inbound event:
1. Validate signature (if webhook)
2. Validate payload against contract
3. Write append-only receipt:
4. `receipts/{source}/{eventId}.json`
5. Upsert canonical object
6. Update ClickUp
7. Send email (if required)
If receipt exists → exit safely.
* * *
# Data Model (R2 Canonical Authority)

```bash
accounts/{accountId}.json
orders/{orderId}.json
support/{supportId}.json
receipts/{source}/{eventId}.json
```

Receipts are immutable ledger entries.
* * *
# ClickUp Projection Layer
List IDs:
Accounts — 901710909567
Orders — 901710818340
Support — 901710818377
ClickUp is never authoritative.
* * *
# Authentication Model
Supported:
*   Google OAuth
*   Magic Link
*   SSO (SAML/OIDC)
Endpoints (Alphabetical):

```perl
POST /auth/google
GET  /auth/google/callback
POST /auth/logout
POST /auth/magic-link/request
POST /auth/magic-link/verify
POST /auth/sso/callback
POST /auth/sso/init
GET  /auth/session
```

All login events:
*   Write login receipt
*   Upsert canonical account
*   Update lastLoginAt
*   Issue HTTP-only secure cookie
Stored in:

```css
accounts/{accountId}.json
auth: {
  provider,
  lastLoginAt,
  lastActiveAt
}
```

* * *
# Staff Compliance Records Gate
Endpoint:

```elixir
POST https://api.taxmonitor.pro/forms/staff/compliance-records
```

Validates against:

```plain
app/contracts/staff/compliance-records.contract.json
```

On final submission:
*   complianceSubmitted = true
*   reportReady = true
ClickUp status updated to:
10 Compliance Records
* * *
# 2848 Two-Signature Sequence
Both signatures occur on Page 2.
Sequence:
1. Generate Page 1 + Page 2
2. Taxpayer signs Page 2
3. Representative signs Page 2
4. Store final signed PDF in R2
Canonical fields:
*   esign2848Status (draft | taxpayer\_signed | fully\_signed)
*   esign2848TaxpayerSignedAt
*   esign2848RepresentativeSignedAt
*   esign2848UrlTaxpayerSignedPdf
*   esign2848UrlFinalPdf
TREE 15 = taxpayer signed
TREE 16 = representative signed + final stored
* * *
# Idempotency & Safety
*   Every event must include eventId
*   Stripe dedupe key: Stripe Session ID
*   Cal dedupe key: Cal event ID
*   Receipt written before canonical change
*   No duplicate tasks
*   No duplicate emails
*   Retry-safe processing
* * *
# Security & Legal Controls
*   Deny-by-default endpoints
*   Webhook signature validation (Stripe + Cal)
*   No secrets in client payloads
*   PII masked in UI
*   No raw SSN logging
*   R2 is authority
*   ClickUp holds projection only
* * *
# Operational Checklist
*   All forms POST to absolute Worker URLs
*   Every event includes eventId
*   Receipt written before state change
*   Canonical upsert before ClickUp update
*   Emails sent only after canonical update
*   Contracts versioned and enforced
*   Login writes receipt
*   2848 state machine enforced