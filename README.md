# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

## Table of Contents

- Architecture Overview
- Architecture Principle
- ClickUp Custom Fields
- ClickUp Structure
- Data Model
- Design Principles
- Environment Variables
- Event Triggers
- Idempotency + Safety
- Lifecycle Flows
- Repository Structure
- Status Contracts

---

## Architecture Principle

- ClickUp is execution
- Pages is presentation
- R2 is the authority (system of record)
- Worker is the logic plane

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

- Cal.com (Bookings)
- Online Forms (Lifecycle + Post-Payment)
- Stripe (Payments)

---

## Repository Structure

/
├─ _redirects
├─ app/ # Portal pages (intake, offer, agreement, payment, login)
│ ├─ agreement.html
│ ├─ index.html
│ ├─ intake.html
│ ├─ login.html
│ ├─ offer.html
│ ├─ payment-success.html
│ └─ payment.html
├─ assets/ # Static assets
│ ├─ favicon.ico
│ └─ logo.svg
├─ build.mjs # Build script
├─ legal/ # Legal pages
│ ├─ privacy.html
│ └─ terms.html
├─ public/ # Static placeholders for deployment
│ └─ .gitkeep
├─ README.md
├─ site/ # Marketing site
│ ├─ case-studies.html
│ ├─ contact.html
│ ├─ index.html
│ ├─ partials/ # Header + footer includes
│ │ ├─ footer.html
│ │ └─ header.html
│ ├─ pricing.html
│ ├─ site.js
│ └─ support.html
├─ styles/ # CSS
│ ├─ app.css
│ └─ site.css
└─ workers/
└─ api/ # Cloudflare Worker API
├─ src/
│ └─ index.js
└─ wrangler.toml


Structure Notes:

- `app/` contains lifecycle-driven portal pages.
- `site/` contains public marketing pages.
- `workers/api/` contains backend orchestration logic.
- ClickUp reflects operational state only.
- R2 stores canonical data.

---

## Event Triggers

Alphabetical:

- Cal.com → Worker → R2 → ClickUp
- Online Forms → Worker → R2 → ClickUp
- Stripe → Worker → R2 → ClickUp

All inbound events:

1. Are verified (signature or session validation)
2. Are written to R2 as append-only receipts
3. Upsert canonical domain objects in R2
4. Upsert or update ClickUp tasks

No direct ClickUp writes occur without R2 update first.

---

## Data Model

### R2 Buckets

accounts/{accountId}.json  
orders/{orderId}.json  
receipts/{source}/{eventId}.json  
support/{supportId}.json  

R2 is the source of truth. ClickUp reflects operational state only.

### Account Object (R2)

- accountId (stable UUID)
- activeOrders[]
- firstName
- lastName
- lifecycleState
- metadata
- primaryEmail
- stripeCustomerId

Represents client lifecycle and Stripe customer state.

### Order Object (R2)

- accountId
- deliveryState
- deliverableUrls
- metadata
- orderId
- orderToken
- productTier
- status
- stripeSubscriptionId

Represents delivery execution.

All structured tax metadata (2848 reps, IRS metadata, transcript data, IA details, compliance internals) lives here — not in ClickUp.

### Support Object (R2)

- accountId
- metadata
- priority
- relatedOrderId (optional)
- status
- supportId
- type (appointment | ticket)

Represents booking and support ticket lifecycle.

### Receipts Ledger (Append-Only)

- eventId
- processed (boolean)
- processingError (nullable)
- rawPayload
- source (cal | form | stripe)
- timestamp

Purpose:

- Auditability
- Debug traceability
- Idempotency
- Replay safety

Receipts are not business models.

---

## ClickUp Structure

ClickUp  
└─ Admin  
   └─ Tax Monitor Pro  
      ├─ Accounts (901710909567)  
      ├─ Orders (901710818340)  
      └─ Support (901710818377)

ClickUp is a workflow projection of R2.

---

## Status Contracts

### Accounts — Lifecycle

Open  
- Lead

Active / Custom  
- Active Prospect  
- Active Client  

Done  
- Inactive Prospect  
- Inactive Client  

Closed  
- Case Closed (default)

Purpose: relationship state only.

### Orders — Delivery Pipeline

Open  
- 0 Booking / Lead Capture  

Active / Custom  
- 1 Intake Triage  
- 2 Checkout/Payment  
- 3 Welcome Intro  
- 4 Filing Status  
- 5 Address Update  
- 6 IRS Authorization (2848)  
- 7 Wet Sig 2848 Down/Upload  
- 9 2848 Processing  

Done  
- 8 Client Exit Survey  
- 10 Compliance Records  

Closed  
- Complete (default)

Orders status is the execution engine.

### Support — Ticket Lifecycle

Open  
- Open / New  

Active / Custom  
- Blocked  
- Client Feedback  
- In Progress  
- In Review  
- Resolved  
- Waiting on Client  

Done  
- Complete  

Closed  
- Closed (default)

Support status represents lifecycle and SLA state.

There is no separate SLA Custom Field.

---

## ClickUp Custom Fields (Operational Projection Only)

Structured intake fields are not stored in ClickUp.

### Accounts CFs

- Account First Name
- Account ID
- Account Last Name
- Account Order Status
- Account Order Task Link
- Account Primary Email
- Account Support Status
- Account Support Task Link

Notes:

- Account Order Status mirrors the latest Order task status.
- Account Support Status mirrors the latest Support task status.

### Orders CFs

- Order 2848 Signed PDF URL
- Order 2848 Unsigned PDF URL
- Order Agreement Signed PDF URL
- Order Compliance Report PDF URL
- Order ID
- Stripe Customer ID
- Stripe Payment Status
- Stripe Payment URL
- Stripe Session ID (idempotency key)

### Support CFs

- Support Action Required
- Support Email
- Support Priority
- Support Related Order ID
- Support Type

Support SLA is driven by Status.

---

## Lifecycle Flows

### Post-Payment

- address_update_submitted
- compliance_submitted
- esign_2848_submitted
- exit_survey_submitted
- filing_status_submitted
- welcome_confirmed

### Pre-Payment

- agreement_accepted
- intake_submitted
- offer_accepted
- payment_completed

All forms POST to Worker.

Worker responsibilities:

- Enforce lifecycle gating
- Update ClickUp task
- Update domain object
- Validate session/token
- Write receipt

---

## Idempotency + Safety

- All events deduplicated by eventId
- Forms: token/session validation
- No direct ClickUp writes before R2 update
- Stripe + Cal: signature validation
- Stripe Session ID used as payment dedupe key

---

## Environment Variables (Worker)

- CAL_WEBHOOK_SECRET
- CLICKUP_ACCOUNTS_LIST_ID
- CLICKUP_API_KEY
- CLICKUP_ORDERS_LIST_ID
- CLICKUP_SUPPORT_LIST_ID
- R2_BUCKET
- SMTP_HOST
- SMTP_PASSWORD
- SMTP_USER
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

---

## Design Principles

- Append-only receipts ledger
- ClickUp as projection layer only
- Idempotent processing
- R2 authority
- Stateless Worker
- Status-driven workflow
- Zero manual lifecycle transitions
