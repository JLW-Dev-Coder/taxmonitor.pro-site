# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

The system is **contract-driven**.  
Forms do not define behavior — JSON contracts define behavior.

---

## Table of Contents

* [Architecture Overview](#architecture-overview)
* [Architecture Principle](#architecture-principle)
* [Contract-Driven Architecture](#contract-driven-architecture)
* [ClickUp Custom Fields](#clickup-custom-fields)
* [ClickUp Structure](#clickup-structure)
* [Data Model](#data-model)
* [Design Principles](#design-principles)
* [Domain & Routing Contract](#domain--routing-contract)
* [Environment Variables](#environment-variables-worker)
* [Event Triggers](#event-triggers)
* [Idempotency + Safety](#idempotency--safety)
* [Lifecycle Flows](#lifecycle-flows)
* [Repository Structure](#repository-structure)
* [Report Rendering Contract](#report-rendering-contract)
* [Status Contracts](#status-contracts)
* [Staff — Compliance Records](#staff--compliance-records)

---

# Architecture Overview

Cloudflare Pages (Portal + Marketing UI)  
↓ (form POST / webhook)  
Cloudflare Worker (API + Orchestration + State Injection)  
↓  
Cloudflare R2 (Authoritative State + Receipts Ledger)  
↓  
ClickUp (Human Task Execution)

External systems:

* Cal.com (Bookings)
* Google Workspace (Transactional Email Sending)
* Online Forms (Lifecycle + Post-Payment)
* Stripe (Payments)

---

# Architecture Principle

* ClickUp is execution
* JSON contracts govern behavior
* Pages is presentation
* R2 is the authority (system of record)
* Worker is the logic plane

---

# Contract-Driven Architecture

## Core Concept

Forms do not define data structures.  
HTML does not define valid options.  
SuiteDash does not define canonical state.

The **JSON contract defines everything**:

* Field controls (checkbox, dropdown, multiselect, radio)
* Storage types
* SuiteDash field alignment
* Type alignment
* Valid enum values
* Validation behavior

---

## Contract Location

Example:

```

app/contracts/staff/compliance-records.contract.json

```

Contracts are:

* Authoritative over UI
* Deterministic
* Enforced by Worker
* Parse-safe JSON (no comments)
* Versioned

---

## Worker Validation Flow

When a form submits:

1. Worker selects contract by form slug
2. Worker validates:
   * Boolean normalization rules
   * Enum strictness
   * Field presence
   * Type alignment
3. Worker rejects unknown values
4. Worker writes append-only receipt
5. Worker upserts canonical R2 object
6. Worker updates ClickUp
7. Worker triggers downstream email or state transition

No form may bypass contract validation.

---

## Why This Matters

The Staff Compliance form directly controls:

* `complianceSubmitted`
* `reportReady`
* Final deliverable rendering
* Order lifecycle closure

This form is the operational gate that determines:

```

contract closed

```

Without contract validation, the system cannot be trusted.

---

# Domain & Routing Contract

## Domain Separation

Presentation (Pages):

* https://taxmonitor.pro
* Serves `/app/*` and `/site/*`

API (Worker):

* https://api.taxmonitor.pro
* All lifecycle, webhook, and form processing occurs here

Worker is never hosted on the root marketing domain.

---

## Form Submission Rule

All forms must POST directly to the Worker domain.

Examples:

```

[https://api.taxmonitor.pro/forms/agreement](https://api.taxmonitor.pro/forms/agreement)
[https://api.taxmonitor.pro/forms/intake](https://api.taxmonitor.pro/forms/intake)
[https://api.taxmonitor.pro/forms/offer](https://api.taxmonitor.pro/forms/offer)
[https://api.taxmonitor.pro/forms/payment](https://api.taxmonitor.pro/forms/payment)
[https://api.taxmonitor.pro/forms/staff/compliance-records](https://api.taxmonitor.pro/forms/staff/compliance-records)

```

Relative paths such as:

```

action="/forms/intake"

```

are not allowed.

---

# Repository Structure

```

.
├─ .gitattributes
├─ .gitignore
├─ README.md
├─ _redirects
├─ build.mjs
├─ app/
│  ├─ agreement.html
│  ├─ contracts/
│  │  ├─ staff/
│  │  │  └─ compliance-records.contract.json
│  │  └─ tm_compliance_record.v2.example.json
│  ├─ index.html
│  ├─ intake.html
│  ├─ login.html
│  ├─ offer.html
│  ├─ pages/
│  │  ├─ flows/
│  │  │  ├─ intake/
│  │  │  │  ├─ agreement.html
│  │  │  │  ├─ intake.html
│  │  │  │  ├─ offer.html
│  │  │  │  └─ payment.html
│  │  │  └─ post-payment/
│  │  │     ├─ address-update.html
│  │  │     ├─ client-exit-survey.html
│  │  │     ├─ compliance-report.html
│  │  │     ├─ esign-2848.html
│  │  │     ├─ filing-status.html
│  │  │     └─ welcome.html
│  │  └─ staff/
│  │     └─ compliance-records.html
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


```

---

## Structure Notes

* `app/contracts/` contains authoritative JSON contracts.
* `app/pages/staff/` contains staff operational forms.
* `site/` contains marketing / informational Pages.
* Worker must import and validate against contracts.
* No hardcoded enum values allowed in HTML.
* Contracts are the only source of truth for dropdown/radio options.

---

# Staff — Compliance Records

Internal operational form.

This form:

* Is contract-driven
* Is enum-strict
* Marks deliverable as ready
* Updates canonical order state

---

## SAVE_ENDPOINT

This is the canonical endpoint the staff compliance form must POST to:

```

[https://api.taxmonitor.pro/forms/staff/compliance-records](https://api.taxmonitor.pro/forms/staff/compliance-records)

```

This endpoint:

* Accepts `mode: "draft" | "final"`
* Writes a receipt (append-only)
* Validates against `app/contracts/staff/compliance-records.contract.json`
* Upserts canonical state
* Updates ClickUp after R2 is updated

---

## Submission Flow

POST → Worker → R2 → ClickUp

Worker must:

1. Write receipt
2. Validate against compliance contract
3. Normalize checkbox fields
4. Update order metadata
5. Set:

```

complianceSubmitted = true
reportReady = true

```

6. Update ClickUp status to:

```

10 Compliance Records

```

---

## Rendering Dependency

Compliance report page renders based on:

```

order.stepBooleans.reportReady === true

```

If true → populated report  
If false → placeholder content

Report page never blocks.  
Lifecycle gating occurs at Worker level only.

---

# Report Rendering Contract

Primary:

```

orders/{orderId}.json

```

Secondary:

```

accounts/{accountId}.json

```

Order object is the authoritative rendering source.

---

# Idempotency + Safety

* All events deduplicated by eventId
* Contract validation is strict
* Email triggers only after canonical state update
* Forms require eventId
* No direct ClickUp writes before R2 update
* Receipts are append-only
* Stripe Session ID used as payment dedupe key
* Stripe and Cal webhooks require signature validation
* Unknown enum values are rejected

---

# Design Principles

* Append-only receipts ledger
* ClickUp as projection layer only
* Contract-driven validation
* Email after canonical state update
* Idempotent processing
* R2 authority
* Stateless Worker
* Status-driven workflow
* Worker-injected rendering state
* Zero manual lifecycle transitions