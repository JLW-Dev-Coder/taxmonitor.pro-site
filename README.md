# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

---

## Table of Contents

* [Architecture Overview](#architecture-overview)
* [Architecture Principle](#architecture-principle)
* [ClickUp Custom Fields](#clickup-custom-fields)
* [ClickUp Structure](#clickup-structure)
* [Contracts](#contracts)
* [Data Model](#data-model)
* [Design Principles](#design-principles)
* [Domain & Routing Contract](#domain--routing-contract)
* [Endpoints](#endpoints)
* [Environment Variables](#environment-variables-worker)
* [Event Triggers](#event-triggers)
* [Idempotency + Safety](#idempotency--safety)
* [Lifecycle Flows](#lifecycle-flows)
* [Repository Structure](#repository-structure)
* [Report Rendering Contract](#report-rendering-contract)
* [Security + Auth](#security--auth)
* [Staff — Compliance Records](#staff--compliance-records)
* [Webhooks](#webhooks)

---

# Architecture Overview

Cloudflare Pages (Portal + Marketing UI)
↓ (form POST / webhook)
Cloudflare Worker (API + Orchestration + State Injection)
↓
R2 (Canonical Authority + Receipts)
↓
ClickUp (Projection Layer)

---

# Architecture Principle

**R2 is the authority. ClickUp is a projection.**

Every inbound event must follow this write order (non-negotiable):

1. Write append-only receipt: `receipts/{source}/{eventId}.json`
2. Upsert canonical: `orders/{orderId}.json` and/or `accounts/{accountId}.json`
3. Update ClickUp (projection layer)

No ClickUp writes before canonical state is updated.

---

# ClickUp Custom Fields

See:

* `app/contracts/clickup/accounts.list.contract.json`
* `app/contracts/clickup/orders.list.contract.json`
* `app/contracts/clickup/support.list.contract.json`

---

# ClickUp Structure

Lists:

* Accounts: `901710909567`
* Orders: `901710818340`
* Support: `901710818377`

---

# Contracts

Contracts are the source of truth for:

* Allowed enum values (dropdown / radio / multiselect)
* Validation strictness
* Worker storage mapping

**No enums live in HTML.** HTML renders options injected by Worker state or contract-driven UI code.

Validation flags required in every form contract:

* `enumStrict=true`
* `rejectUnknownValues=true`
* `normalizeCheckboxToBoolean=true`

Registry:

* `app/contracts/contract-registry.json`

---

# Data Model

R2 keys:

* `accounts/{accountId}.json`
* `orders/{orderId}.json`
* `support/{supportId}.json`
* `receipts/{source}/{eventId}.json` (append-only)

R2 is authoritative. ClickUp is derived.

---

# Design Principles

* Email only after canonical state update (R2 first)
* Receipt-first write order for every inbound event
* Worker injects rendering state into Pages responses
* Idempotency based on receipt `eventId` (dedupe key)

---

# Domain & Routing Contract

Pages:

* `https://taxmonitor.pro` (serves `/site/*` and `/app/*`)

Worker API:

* `https://api.taxmonitor.pro` (route: `api.taxmonitor.pro/*`)

Forms must POST to absolute Worker URLs:

* `https://api.taxmonitor.pro/forms/*`

---

# Endpoints

Worker base:

* `https://api.taxmonitor.pro`

## Read endpoints

* `GET /orders/{orderId}` (non-negotiable)

## Form submit endpoints

Client (token-gated):

* `POST /forms/agreement`
* `POST /forms/intake`
* `POST /forms/offer`
* `POST /forms/payment`
* `POST /forms/post-payment/address-update`
* `POST /forms/post-payment/client-exit-survey`
* `POST /forms/post-payment/compliance-report`
* `POST /forms/post-payment/esign-2848`
* `POST /forms/post-payment/filing-status`
* `POST /forms/post-payment/welcome`

Staff (auth required):

* `POST /forms/staff/compliance-records`

---

# Security + Auth

## Default policy

**Deny by default.** Any endpoint without an explicit auth policy must reject requests.

## Staff endpoints

Staff endpoints require authentication.

Auth mechanism: **TBD (blocked until chosen).**

Until chosen and implemented, staff endpoints must:

* Return `401/403` by default
* Never accept unauthenticated writes

## Client endpoints

Client form endpoints are token-gated by a **non-guessable Order Token** (a.k.a. `sessionToken`).

Requirements:

* Token must be validated server-side on every request
* Token must map to a single Order ID
* Token must not be derivable from Order ID

---

# PPI + PII Handling

Never log raw:

* SSN
* DOB
* Full street address

UI rules:

* SSN is masked by default (last-4 only)
* Full SSN may only be revealed via a controlled, client-side toggle (never logged)

Worker rules:

* Receipts may store necessary values, but logs must never include raw PII/PPI
* Sanitized logging only (e.g., last-4, redacted fields)

---

# Report Rendering Contract

Orders are primary. Accounts are secondary.

When `reportReady=false`:

* Render placeholders
* Do not show report download links

## Compliance Report PDF URL rule

When a compliance report PDF is generated (staff finalization or defined client trigger):

1. Worker stores PDF in R2
2. Worker produces a URL
3. Worker updates Orders task CF:

* `Order Compliance Report PDF URL`
* Field ID: `3c4c2986-c8df-47b7-a676-258333c71558`

Client UI must read this field to display the download link.

---

# Staff — Compliance Records

Contract:

* `app/contracts/staff/compliance-records.contract.json`

Behavior:

* Writes receipt then upserts canonical Order/Account
* Updates ClickUp Orders status to `10 compliance records` when final

---

# Webhooks

Webhook endpoints must validate signatures.

## Stripe

* `POST /webhooks/stripe`
* Validate using `STRIPE_WEBHOOK_SECRET`
* Dedupe key: Stripe Session ID

## Cal.com

* `POST /webhooks/cal`
* Validate using `CAL_WEBHOOK_SECRET`
* Dedupe key: Cal event ID

Google Workspace email is outbound-only. No inbound email endpoint exists.