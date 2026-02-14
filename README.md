# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

The system is **contract-driven**.
Forms do not define behavior — JSON contracts define behavior.

---

## Table of Contents

* [Architecture Overview](#architecture-overview)
* [Architecture Principle](#architecture-principle)
* [Contract Registry](#contract-registry)
* [Contract-Driven Architecture](#contract-driven-architecture)
* [Data Model](#data-model)
* [Domain & Routing Contract](#domain--routing-contract)
* [Endpoints](#endpoints)
* [Authentication & PPI Protection](#authentication--ppi-protection)
* [ClickUp Projection Contracts](#clickup-projection-contracts)
* [PDF Generation + Overrides](#pdf-generation--overrides)
* [Idempotency + Safety](#idempotency--safety)
* [Lifecycle Flows](#lifecycle-flows)
* [Repository Structure](#repository-structure)
* [Report Rendering Contract](#report-rendering-contract)
* [Staff — Compliance Records](#staff--compliance-records)
* [Design Principles](#design-principles)

---

# Architecture Overview

Cloudflare Pages (Portal + Marketing UI)
↓ (form POST / webhook)
Cloudflare Worker (API + Orchestration + State Injection)
↓
Cloudflare R2 (Authoritative State + Receipts Ledger)
↓
ClickUp (Human Execution Layer)

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
* No lifecycle transitions occur outside Worker
* No ClickUp write occurs before R2 update

---

# Contract Registry

All form contracts are registered in:

```
app/contracts/contract-registry.json
```

The registry defines:

* Contract ID
* Version
* Endpoint
* Method
* Receipt source
* Canonical object writes
* ClickUp projection behavior
* Auth requirement

No contract may exist without registry inclusion.

---

# Contract-Driven Architecture

## Core Concept

Forms do not define data structures.
HTML does not define valid options.
External systems do not define canonical state.

The JSON contract defines:

* Field controls
* Storage types
* Enum values
* Strict validation rules
* Nullable behavior
* Boolean normalization
* Worker enforcement rules

---

## Worker Validation Flow

When any form submits:

1. Worker selects contract from registry
2. Worker validates:

   * Enum strictness
   * Unknown field rejection
   * Boolean normalization
   * Required field presence
   * Type alignment
3. Worker writes append-only receipt:

   ```
   receipts/{source}/{eventId}.json
   ```
4. Worker upserts canonical object:

   ```
   orders/{orderId}.json
   accounts/{accountId}.json
   support/{supportId}.json
   ```
5. Worker updates ClickUp
6. Worker triggers downstream email

Forms cannot bypass validation.

---

# Data Model

R2 is authoritative.

Canonical paths:

```
accounts/{accountId}.json
orders/{orderId}.json
support/{supportId}.json
receipts/{source}/{eventId}.json
```

Orders are primary rendering objects.

Accounts are secondary reference objects.

---

# Domain & Routing Contract

## Domain Separation

Pages:

```
https://taxmonitor.pro
```

Worker:

```
https://api.taxmonitor.pro
```

Worker is never hosted on root marketing domain.

---

## Form Submission Rule

All forms must POST directly to Worker domain.

Example:

```
POST https://api.taxmonitor.pro/forms/intake
```

Relative paths are not allowed.

---

# Endpoints

## Read Endpoints

```
GET /orders/{orderId}
```

---

## Client Form Endpoints (10)

```
POST /forms/agreement
POST /forms/intake
POST /forms/offer
POST /forms/payment
POST /forms/post-payment/address-update
POST /forms/post-payment/client-exit-survey
POST /forms/post-payment/compliance-report
POST /forms/post-payment/esign-2848
POST /forms/post-payment/filing-status
POST /forms/post-payment/welcome
```

---

## Staff Endpoint (1)

```
POST /forms/staff/compliance-records
```

---

## Webhook Endpoints

```
POST /webhooks/cal
POST /webhooks/stripe
```

Stripe and Cal webhooks require signature validation.

---

# Authentication & PPI Protection

## PPI Handling

The system processes Personally Identifiable Information including:

* SSN (masked by default)
* Address
* Filing status
* IRS balances
* Revenue officer details

Rules:

* SSN masked by default in UI
* No raw SSN logged
* No PPI written to console logs
* Receipts contain validated payload only
* Worker never logs request bodies in production

---

## Staff Authentication

Staff endpoints must require authentication.

Allowed patterns:

* Cloudflare Access JWT validation
* OAuth (Google Workspace)
* Signed session token

Until explicitly implemented, staff routes must deny unauthenticated requests.

---

## Client Access

Client read access must require:

* Non-guessable Order ID
* Token-based validation for sensitive reads
* No public indexable URLs for reports

---

# ClickUp Projection Contracts

ClickUp is projection only.

Lists:

* Accounts — `901710909567`
* Orders — `901710818340`
* Support — `901710818377`

ClickUp JSON projection contracts must define:

* List ID
* Custom Field IDs
* Status IDs
* Option IDs for dropdowns

Includes Orders status:

```
template
```

ClickUp must never be treated as source of truth.

---

# PDF Generation + Overrides

## Compliance Report

When compliance is finalized:

1. Worker generates PDF
2. Worker stores PDF in R2
3. Worker updates Orders CF:

   ```
   Order Compliance Report PDF URL
   ```
4. Worker sets:

   ```
   complianceSubmitted = true
   reportReady = true
   ```
5. Worker updates ClickUp status:

   ```
   10 Compliance Records
   ```

Client may download report anytime.

Staff may regenerate PDF override if needed.

---

# Idempotency + Safety

* All events deduplicated by eventId
* Stripe Session ID is payment dedupe key
* Append-only receipts
* Unknown enum values rejected
* No direct ClickUp writes before R2 update
* Email triggered only after canonical state update
* Worker is stateless
* R2 is authoritative

---

# Lifecycle Flows

Pre-Payment:

1. Booking
2. Intake
3. Offer
4. Agreement
5. Payment

Post-Payment:

6. Welcome
7. Filing Status
8. Address Update
9. IRS Authorization (2848)
10. Compliance Report
11. Exit Survey

Lifecycle gating enforced at Worker level.

---

# Repository Structure

```
.
├─ app/
│  ├─ contracts/
│  │  ├─ clickup/
│  │  ├─ forms/
│  │  └─ staff/
│  ├─ pages/
│  │  ├─ flows/
│  │  └─ staff/
│  └─ partials/
├─ assets/
├─ legal/
├─ site/
├─ styles/
└─ workers/
```

Contracts are authoritative over UI.

---

# Report Rendering Contract

Primary source:

```
orders/{orderId}.json
```

Rendering rule:

```
order.stepBooleans.reportReady === true
```

If true → populated report
If false → placeholder content

Report page never blocks.

---

# Staff — Compliance Records

Internal operational form.

This form:

* Is contract-driven
* Is enum-strict
* Controls complianceSubmitted
* Controls reportReady
* Generates Compliance PDF
* Updates ClickUp
* Closes lifecycle

Canonical endpoint:

```
POST https://api.taxmonitor.pro/forms/staff/compliance-records
```

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
* Explicit endpoints
* No hidden state