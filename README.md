# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for tax monitoring services.

Architecture principle:
- R2 is the authority (system of record)
- Worker is the logic plane
- ClickUp is execution
- Pages is presentation

---

## Architecture Overview

Cloudflare Pages (Portal UI)
        ↓ (form POST / webhook)
Cloudflare Worker (API + Orchestration)
        ↓
Cloudflare R2 (Authoritative State + Event Log)
        ↓
ClickUp (Human Task Execution)

External systems:
- Cal.com (Bookings)
- Stripe (Payments)
- Online Forms (Lifecycle + Post-Payment)

---

## Event Triggers

Alphabetical:

- Cal.com → Worker → R2 → ClickUp
- Online Forms → Worker → R2 → ClickUp
- Stripe → Worker → R2 → ClickUp

All events:
1. Are verified (signature or session validation)
2. Are written to R2 as append-only event logs
3. Upsert canonical account/order objects in R2
4. Upsert or update ClickUp tasks

---

## Data Model

### R2 Buckets

accounts/{accountId}.json  
orders/{orderId}.json  
events/{source}/{eventId}.json  

R2 is the source of truth. ClickUp reflects operational state only.

### Account Object (R2)

- accountId (stable UUID)
- primaryContact
- email
- lifecycleState
- activeOrders[]
- metadata

### Order Object (R2)

- orderId
- accountId
- productTier
- stripeCustomerId
- stripeSubscriptionId
- status
- deliveryState
- metadata

### Event Log (Append-Only)

- eventId
- source (cal, stripe, form)
- type
- timestamp
- rawPayload
- processed: true/false

---

## ClickUp Structure

ClickUp
└─ Admin
   └─ Tax Monitor Pro
      ├─ Accounts
      ├─ Orders
      └─ Support

### Accounts (Index List)

One task per client.

Purpose:
- Human-facing master record
- Cross-links to Orders and Support
- High-level status fields only

Custom fields:
- Account ID
- Primary Email
- Lifecycle State
- Active Order Count

### Orders

Handles delivery execution:

- 2848 review
- CAF verification
- Compliance analysis
- Monitoring lifecycle tasks

Custom fields:
- Account ID
- Order ID
- Product Tier
- Stripe Subscription ID
- Delivery State

### Support

Handles:

- Appointment tasks
- Ticket tasks

Custom fields:
- Account ID
- Related Order ID (optional)

---

## Lifecycle Flows

### Pre-Payment Flow

- intake_submitted
- offer_accepted
- agreement_accepted
- payment_completed (Stripe)

### Post-Payment Flow

- address_update_submitted
- compliance_submitted
- esign_2848_submitted
- exit_survey_submitted
- filing_status_submitted
- welcome_confirmed

All forms POST to Worker.

Worker responsibilities:
- Validate session
- Enforce lifecycle gating
- Write event to R2
- Update canonical object
- Update relevant ClickUp task

---

## Idempotency + Safety

- Stripe + Cal.com: signature validation
- Forms: session or token validation
- All events deduplicated by eventId
- No direct writes to ClickUp without R2 update first

---

## Environment Variables (Worker)

- CLICKUP_API_KEY
- CLICKUP_SPACE_ID
- R2_BUCKET
- SMTP_HOST
- SMTP_PASSWORD
- SMTP_USER
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- CAL_WEBHOOK_SECRET

---

## Deployment Checklist (1A — Operator Intake Form Submitted)

See separate checklist section.

---

## Testing Requirements

- Test intake flow forms submitted
- Test post-payment flow forms submitted
- Test booking completed (Cal.com)
- Test transaction completed (Stripe)
- Test 2848 flow executed
- Test compliance report generated

---

## Design Principles

- Append-only event log
- Idempotent processing
- R2 authority
- Stateless Worker
- Zero manual lifecycle transitions
