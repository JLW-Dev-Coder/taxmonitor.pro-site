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
* Pages is presentation
* R2 is the authority (system of record)
* Worker is the logic plane
* JSON contracts govern behavior

---

# Contract-Driven Architecture

## Core Concept

Forms do not define data structures.
HTML does not define valid options.
SuiteDash does not define canonical state.

The **JSON contract defines everything**:

* Field controls (radio, dropdown, multiselect, checkbox)
* Valid enum values
* Storage types
* SuiteDash field alignment
* Validation behavior
* Boolean normalization rules

---

## Contract Location

Example:

```
/contracts/staff/compliance-records.contract.json
```

Contracts are:

* Versioned
* Deterministic
* Parse-safe JSON (no comments)
* Enforced by Worker
* Authoritative over UI

---

## Worker Validation Flow

When a form submits:

1. Worker selects contract by form slug
2. Worker validates:

   * Field presence
   * Enum strictness
   * Type alignment
   * Boolean normalization
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

* [https://taxmonitor.pro](https://taxmonitor.pro)
* Serves `/app/*` and `/site/*`

API (Worker):

* [https://api.taxmonitor.pro](https://api.taxmonitor.pro)
* All lifecycle, webhook, and form processing occurs here

Worker is never hosted on the root marketing domain.

---

## Form Submission Rule

All forms must POST directly to the Worker domain.

Examples:

```
https://api.taxmonitor.pro/forms/intake
https://api.taxmonitor.pro/forms/offer
https://api.taxmonitor.pro/forms/agreement
https://api.taxmonitor.pro/forms/payment
https://api.taxmonitor.pro/forms/compliance
```

Relative paths such as:

```
action="/forms/intake"
```

are not allowed.

---

# Repository Structure

```
app/
   contracts/
      compliance-records.contract.json
   pages/
      staff/
         compliance-records.html
workers/
   api/
      src/
         index.js
```

---

## Structure Notes

* `contracts/` contains authoritative JSON schemas.
* `staff/` forms must render from contract enums.
* Worker must import and validate against contracts.
* No hardcoded enum values allowed in HTML.
* Contracts are the only source of truth for dropdown/radio options.

---

# Staff — Compliance Records

Internal operational form.

This form:

* Is contract-driven
* Is enum-strict
* Updates canonical order state
* Marks deliverable as ready
* Closes operational lifecycle

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
* Stripe Session ID used as payment dedupe key
* Forms require eventId
* No direct ClickUp writes before R2 update
* Stripe and Cal webhooks require signature validation
* Email triggers only after canonical state update
* Receipts are append-only
* Contract validation is strict
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

---

# What Just Happened Architecturally

The compliance JSON contract now:

* Bridges operational staff execution
* Controls canonical state mutation
* Determines report rendering
* Governs order closure

The system is no longer form-driven.

It is contract-driven.

That is the architectural turning point.