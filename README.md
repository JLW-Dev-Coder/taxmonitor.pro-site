# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

## Architecture Principle

- R2 is the authority (system of record)
- Worker is the logic plane
- ClickUp is execution
- Pages is presentation

---

# Architecture Overview

Cloudflare Pages (Portal UI)  
        ↓ (form POST / webhook)  
Cloudflare Worker (API + Orchestration)  
        ↓  
Cloudflare R2 (Authoritative State + Receipts Ledger)  
        ↓  
ClickUp (Human Task Execution)

External systems:

- Cal.com (Bookings)
- Stripe (Payments)
- Online Forms (Lifecycle + Post-Payment)

---

# Repository Structure

```

/
├─ README.md
├─ WORKER_CONTRACT.md
├─ CLICKUP_SETUP.md
├─ DEPLOYMENT.md
├─ INCIDENT_RUNBOOK.md
│
├─ src/
│  ├─ worker/
│  │  ├─ handlers/
│  │  │  ├─ cal.ts
│  │  │  ├─ stripe.ts
│  │  │  └─ forms.ts
│  │  ├─ domain/
│  │  │  ├─ accounts.ts
│  │  │  ├─ orders.ts
│  │  │  └─ support.ts
│  │  ├─ clickup/
│  │  │  ├─ accounts.ts
│  │  │  ├─ orders.ts
│  │  │  └─ support.ts
│  │  ├─ receipts/
│  │  │  └─ ledger.ts
│  │  ├─ utils/
│  │  └─ index.ts
│
├─ r2-schema/
│  ├─ accounts.schema.json
│  ├─ orders.schema.json
│  └─ support.schema.json
│
├─ tests/
│  ├─ intake.test.ts
│  ├─ stripe.test.ts
│  ├─ cal.test.ts
│  └─ lifecycle.test.ts
│
└─ wrangler.toml

```

Structure Principles:

- Domain logic is separated from ClickUp integration.
- Receipts handling is isolated.
- R2 schema definitions are explicit.
- Worker remains stateless.
- ClickUp is a projection layer only.

---

# Event Triggers

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

# Data Model

## R2 Buckets

accounts/{accountId}.json  
orders/{orderId}.json  
support/{supportId}.json  
receipts/{source}/{eventId}.json  

R2 is the source of truth. ClickUp reflects operational state only.

---

## Account Object (R2)

- accountId (stable UUID)
- firstName
- lastName
- primaryEmail
- lifecycleState
- stripeCustomerId
- activeOrders[]
- metadata

Represents client lifecycle and Stripe customer state.

---

## Order Object (R2)

- orderId
- accountId
- productTier
- stripeSubscriptionId
- status
- deliveryState
- orderToken
- deliverableUrls
- metadata

Represents delivery execution.

All structured tax metadata (2848 reps, IRS metadata, transcript data, IA details, compliance internals) lives here — not in ClickUp.

---

## Support Object (R2)

- supportId
- accountId
- relatedOrderId (optional)
- type (appointment | ticket)
- status
- priority
- metadata

Represents booking and support ticket lifecycle.

---

## Receipts Ledger (Append-Only)

- eventId
- source (cal | stripe | form)
- timestamp
- rawPayload
- processed (boolean)
- processingError (nullable)

Purpose:

- Idempotency
- Auditability
- Replay safety
- Debug traceability

Receipts are not business models.

---

# ClickUp Structure

ClickUp  
└─ Admin  
   └─ Tax Monitor Pro  
      ├─ Accounts (901710909567)  
      ├─ Orders (901710818340)  
      └─ Support (901710818377)  

ClickUp is a workflow projection of R2.

---

# Status Contracts

## Accounts — Lifecycle

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

---

## Orders — Delivery Pipeline

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

---

## Support — Ticket Lifecycle

Open  
- Open / New  

Active / Custom  
- In Progress  
- Waiting on Client  
- Blocked  
- In Review  
- Resolved  
- Client Feedback  

Done  
- Complete  

Closed  
- Closed (default)

Support status represents lifecycle and SLA state.

There is no separate SLA Custom Field.

---

# ClickUp Custom Fields (Operational Projection Only)

Structured intake fields are not stored in ClickUp.

## Accounts CFs

- Account ID
- Account First Name
- Account Last Name
- Account Primary Email
- Account Order Status
- Account Order Task Link
- Account Support Status
- Account Support Task Link

Account Order Status mirrors the latest Order task status.  
Account Support Status mirrors the latest Support task status.

---

## Orders CFs

- Order ID
- Order 2848 Unsigned PDF URL
- Order 2848 Signed PDF URL
- Order Agreement Signed PDF URL
- Order Compliance Report PDF URL
- Stripe Session ID (idempotency key)
- Stripe Customer ID
- Stripe Payment Status
- Stripe Payment URL

No structured tax metadata lives in ClickUp.

---

## Support CFs

- Support Action Required
- Support Email
- Support Priority
- Support Related Order ID
- Support Type

Support SLA is driven by Status.

---

# Lifecycle Flows

## Pre-Payment

- intake_submitted
- offer_accepted
- agreement_accepted
- payment_completed

## Post-Payment

- address_update_submitted
- compliance_submitted
- esign_2848_submitted
- exit_survey_submitted
- filing_status_submitted
- welcome_confirmed

All forms POST to Worker.

Worker responsibilities:

- Validate session/token
- Enforce lifecycle gating
- Write receipt
- Update domain object
- Update ClickUp task

---

# Idempotency + Safety

- Stripe + Cal: signature validation
- Forms: token/session validation
- All events deduplicated by eventId
- Stripe Session ID used as payment dedupe key
- No direct ClickUp writes before R2 update

---

# Environment Variables (Worker)

- CLICKUP_API_KEY
- CLICKUP_ACCOUNTS_LIST_ID
- CLICKUP_ORDERS_LIST_ID
- CLICKUP_SUPPORT_LIST_ID
- R2_BUCKET
- SMTP_HOST
- SMTP_PASSWORD
- SMTP_USER
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- CAL_WEBHOOK_SECRET

---

# Design Principles

- Append-only receipts ledger
- Idempotent processing
- R2 authority
- Stateless Worker
- Status-driven workflow
- Zero manual lifecycle transitions
- ClickUp as projection layer only
```

---
