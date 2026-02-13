# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

---

## Table of Contents

* [Architecture Overview](#architecture-overview)
* [Architecture Principle](#architecture-principle)
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

---

# Domain & Routing Contract

## Domain Separation

**Presentation (Pages):**

* [https://taxmonitor.pro](https://taxmonitor.pro)
* Serves `/app/*` and `/site/*`

**API (Worker):**

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

All HTML forms must use absolute API URLs.

---

## Worker Routes

Worker must include:

* api.taxmonitor.pro/*

Root domain must not proxy lifecycle endpoints unless explicitly documented.

---

# Repository Structure

```
/
app/
   ├─ agreement.html
   ├─ index.html
      ├─ flows/
      ├─ intake/
         ├─ agreement.html
         ├─ intake.html
         ├─ offer.html
         └─ payment.html
      └─ post-payment/
         ├─ address-update.html
         ├─ client-exit-survey.html
         ├─ compliance-report.html
         ├─ esign-2848.html
         ├─ filing-status.html
         └─ welcome.html
   ├─ intake.html
   ├─ login.html
   ├─ offer.html
   ├─ payment-success.html
   ├─ payment.html
   ├─ partials/
      ├─ sidebar.html
      └─ topbar.html
   └─ pages/
      ├─ calendar/
         └─ index.html
      ├─ files/
         └─ index.html
      ├─ messaging/
         └─ index.html
      ├─ office/
         ├─ estimates.html
         ├─ files.html
         ├─ invoices.html
         ├─ my-billing.html
         ├─ payments.html
         └─ proposals.html
      ├─ projects/
         └─ index.html
      └─ support/
         └─ index.html

assets/
   ├─ favicon.ico
   ├─ favicon.svg
   └─ logo.svg

legal/
   ├─ privacy.html
   └─ terms.html

public/
   └─ .gitkeep

site/
   ├─ contact.html
   ├─ index.html
   ├─ pricing.html
   ├─ site.js
   ├─ support.html
   ├─ partials/
      ├─ footer.html
      └─ header.html
   └─ resources/
      ├─ 433F.html
      └─ case-studies.html

staff/
   └─ compliance-records.html

styles/
   ├─ app.css
   └─ site.css

workers/
   └─ api/
      ├─ wrangler.toml
      └─ src/
         └─ index.js

README.md
_redirects
build.mjs

```

## Structure Notes

* `app/` contains lifecycle-driven portal pages.
* `site/` contains public marketing pages.
* `staff/` contains internal operational tools.
* `workers/api/` contains orchestration logic.
* ClickUp reflects operational state only.
* R2 stores canonical data.
* Worker injects state into Pages via JSON bootstrap.

---

# Data Model

## R2 Buckets

```
accounts/{accountId}.json
orders/{orderId}.json
receipts/{source}/{eventId}.json
support/{supportId}.json
```

R2 is the source of truth.

---

## Account Object (R2)

* accountId
* activeOrders[]
* firstName
* lastName
* lifecycleState
* metadata
* primaryEmail
* stripeCustomerId

---

## Order Object (R2) — Primary Rendering Source

* accountId
* deliveryState
* deliverableUrls
* metadata
* orderId
* orderToken
* productTier
* status
* stripeSubscriptionId
* stepBooleans

### Step Boolean Model

* intakeComplete
* offerAccepted
* agreementAccepted
* paymentCompleted
* welcomeConfirmed
* filingStatusSubmitted
* addressUpdateSubmitted
* esign2848Submitted
* complianceSubmitted
* reportReady

True → render content
False → render placeholder copy

---

# Report Rendering Contract

## Rendering Source

Primary:

```
orders/{orderId}.json
```

Secondary:

```
accounts/{accountId}.json
```

Worker reads Order first.
Worker reads Account if referenced in Order.

---

## Compliance Report Logic

If:

```
order.stepBooleans.reportReady === true
```

Then render populated report.

If false:

* Render placeholder copy
* Display empty fields
* Guide user to required step

Page is never blocked.

---

# Staff — Compliance Records

Internal operational form.

**Submission Flow**

POST → Worker → R2 → ClickUp

Worker must:

1. Write receipt
2. Update order metadata
3. Set:

   ```
   complianceSubmitted = true
   reportReady = true
   ```
4. Update ClickUp status to:

   ```
   10 Compliance Records
   ```

---

# Lifecycle Flows

## Pre-Payment

* agreement_accepted
* intake_submitted
* offer_accepted
* payment_completed

## Post-Payment

* address_update_submitted
* compliance_submitted
* esign_2848_submitted
* exit_survey_submitted
* filing_status_submitted
* welcome_confirmed

Worker enforces lifecycle gating.

---

# Idempotency + Safety

* All events deduplicated by eventId
* Stripe Session ID used as payment dedupe key
* Forms require eventId
* No direct ClickUp writes before R2 update
* Stripe and Cal webhooks require signature validation
* Email triggers only after canonical state update
* Receipts are append-only

---

# Environment Variables (Worker)

Wrangler-only configuration.

## Bindings

* R2_BUCKET

## Secrets

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* GOOGLE_PRIVATE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

## Plaintext Vars (Alphabetical)

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

# Design Principles

* Append-only receipts ledger
* ClickUp as projection layer only
* Email after canonical state update
* Idempotent processing
* R2 authority
* Stateless Worker
* Status-driven workflow
* Worker-injected rendering state
* Zero manual lifecycle transitions






