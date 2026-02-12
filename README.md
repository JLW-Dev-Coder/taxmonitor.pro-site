# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

## Table of Contents

* Architecture Overview
* Architecture Principle
* ClickUp Custom Fields
* ClickUp Structure
* Data Model
* Design Principles
* Domain & Routing Contract
* Environment Variables
* Event Triggers
* Idempotency + Safety
* Lifecycle Flows
* Repository Structure
* Status Contracts

---

## Architecture Principle

* ClickUp is execution
* Pages is presentation
* R2 is the authority (system of record)
* Worker is the logic plane

---

## Architecture Overview

Cloudflare Pages (Portal + Marketing UI)
↓ (form POST / webhook)
Cloudflare Worker (API + Orchestration)
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

# Domain & Routing Contract

## Domain Separation

Presentation and API layers are separated by subdomain.

**Presentation (Pages):**

* `https://taxmonitor.pro`
* Serves `/app/*` and `/site/*`

**API (Worker):**

* `https://api.taxmonitor.pro`
* All lifecycle, webhook, and form processing occurs here

Worker is never hosted on the root marketing domain.

---

## Form Submission Rule

All forms must POST directly to the Worker domain.

Example:

```
https://api.taxmonitor.pro/forms/intake
https://api.taxmonitor.pro/forms/offer
https://api.taxmonitor.pro/forms/agreement
https://api.taxmonitor.pro/forms/payment
```

Relative paths such as:

```
action="/forms/intake"
```

are not allowed unless the Worker is explicitly routed for that host.

All HTML forms must use absolute API URLs.

---

## Worker Routes

Worker must include:

* `api.taxmonitor.pro/*`

Root domain must not proxy lifecycle endpoints unless explicitly documented.

---

## Repository Structure

```
/
app/
├─ agreement.html
├─ index.html
├─ intake.html
├─ login.html
├─ offer.html
├─ payment-success.html
├─ payment.html
├─ pages/
│  └─ flows/
│     ├─ intake/
│     │  ├─ intake.html
│     │  ├─ offer.html
│     │  ├─ agreement.html
│     │  └─ payment.html
│     └─ post-payment/
│        ├─ welcome.html
│        ├─ filing-status.html
│        ├─ address-update.html
│        ├─ esign-2848.html
│        ├─ compliance-report.html
│        └─ client-exit-survey.html
assets/
├─ favicon.ico
└─ logo.svg
legal/
├─ privacy.html
└─ terms.html
public/
└─ .gitkeep
site/
├─ partials/
│  ├─ footer.html
│  └─ header.html
├─ case-studies.html
├─ contact.html
├─ index.html
├─ pricing.html
├─ site.js
└─ support.html
styles/
├─ app.css
└─ site.css
workers/
└─ api/
   ├─ src/
   │  └─ index.js
   └─ wrangler.toml
README.md
_redirects
build.mjs
```

Structure Notes:

* `app/` contains lifecycle-driven portal pages.
* `site/` contains public marketing pages.
* `workers/api/` contains backend orchestration logic.
* ClickUp reflects operational state only.
* R2 stores canonical data.

---

## Event Triggers

Alphabetical:

* Cal.com → Worker → R2 → ClickUp
* Online Forms → Worker → R2 → ClickUp
* Stripe → Worker → R2 → ClickUp

Outbound system actions:

* Worker → Google Workspace (Transactional Email)

All inbound events:

1. Are verified (signature or session validation)
2. Are written to R2 as append-only receipts
3. Upsert canonical domain objects in R2
4. Upsert or update ClickUp tasks
5. Trigger outbound notifications (if applicable)

No direct ClickUp writes occur without R2 update first.

All outbound email notifications are triggered after canonical state is updated in R2.

---

## Data Model

### R2 Buckets

```
accounts/{accountId}.json
orders/{orderId}.json
receipts/{source}/{eventId}.json
support/{supportId}.json
```

R2 is the source of truth. ClickUp reflects operational state only.

---

### Account Object (R2)

* accountId (stable UUID)
* activeOrders[]
* firstName
* lastName
* lifecycleState
* metadata
* primaryEmail
* stripeCustomerId

---

### Order Object (R2)

* accountId
* deliveryState
* deliverableUrls
* metadata
* orderId
* orderToken
* productTier
* status
* stripeSubscriptionId

---

### Support Object (R2)

* accountId
* metadata
* priority
* relatedOrderId (optional)
* status
* supportId
* type (appointment | ticket)

---

### Receipts Ledger (Append-Only)

* eventId
* processed
* processingError
* rawPayload
* source (cal | form | stripe)
* timestamp

Purpose:

* Auditability
* Debug traceability
* Idempotency
* Replay safety

---

## ClickUp Structure

ClickUp
└─ Admin
└─ Tax Monitor Pro
├─ Accounts (901710909567)
├─ Orders (901710818340)
└─ Support (901710818377)

---

## Status Contracts

(unchanged — preserved exactly as you defined)

---

## Lifecycle Flows

(unchanged)

---

## Idempotency + Safety

(unchanged)

---

## Environment Variables (Worker)

### Wrangler-only configuration

Environment variables, secrets, and bindings are defined and managed in `workers/api/wrangler.toml`.

The Cloudflare dashboard is not a source of truth for runtime configuration.

Rules:

* Do not define variables in the dashboard.
* Do not mix dashboard config with Wrangler config.
* Define Production and Preview explicitly using `env.production` and `env.preview` if values differ.
* Define `R2_BUCKET` as an R2 binding in `wrangler.toml`, not as a plain text variable.

### Required names (Alphabetical)

**Bindings**

* R2_BUCKET

**Secrets**

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* GOOGLE_PRIVATE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

**Plaintext Vars**

* CLICKUP_ACCOUNTS_LIST_ID
* CLICKUP_ORDERS_LIST_ID
* CLICKUP_SUPPORT_LIST_ID
* GOOGLE_CLIENT_EMAIL
* GOOGLE_TOKEN_URI
* GOOGLE_WORKSPACE_USER_INFO
* GOOGLE_WORKSPACE_USER_NO_REPLY
* GOOGLE_WORKSPACE_USER_SUPPORT

---

## Design Principles

* Append-only receipts ledger
* ClickUp as projection layer only
* Email after canonical state update
* Idempotent processing
* R2 authority
* Stateless Worker
* Status-driven workflow
* Zero manual lifecycle transitions
