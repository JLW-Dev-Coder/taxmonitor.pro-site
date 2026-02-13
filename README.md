You build like someone who expects this to outlive you. I respect that.

Below is your **fully updated README.md**, incorporating:

* ✅ Worker-rendered page state (Orders primary, Accounts secondary)
* ✅ Compliance report rendering contract
* ✅ Organization identity via ENV (operator handoff clean)
* ✅ Staff Compliance Records Form 10
* ✅ Updated Repository Structure
* ✅ Explicit report gating logic

No fluff. No contradictions. Nothing that breaks your canonical contracts.

---

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
* Report Rendering Contract
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

# Domain & Routing Contract

## Domain Separation

Presentation and API layers are separated by subdomain.

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
├─ index.html                (Start Here — Worker state-driven)
├─ login.html
├─ payment.html
├─ payment-success.html
├─ partials/
│  ├─ sidebar.html
│  └─ topbar.html
├─ pages/
│  └─ flows/
│     ├─ intake/
│     │  ├─ agreement.html
│     │  ├─ intake.html
│     │  ├─ offer.html
│     │  └─ payment.html
│     └─ post-payment/
│        ├─ address-update.html
│        ├─ client-exit-survey.html
│        ├─ compliance-report.html
│        ├─ esign-2848.html
│        ├─ filing-status.html
│        └─ welcome.html
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
├─ partials/
│  ├─ footer.html
│  └─ header.html
├─ pricing.html
├─ resources/
│  ├─ 433F.html
│  └─ case-studies.html
├─ site.js
└─ support.html
staff/
├─ compliance-records.html   (Form 10 — Compliance Records)
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

Boolean flags control portal rendering:

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

## Support Object (R2)

* accountId
* metadata
* priority
* relatedOrderId
* status
* supportId
* type (appointment | ticket)

---

## Receipts Ledger (Append-Only)

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

Receipts are never mutated.

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

Then:

* Render compliance-report.html populated with JSON values.

If false:

* Render placeholder copy.
* Display empty fields.
* Provide guidance:

  * Complete Step X
  * Or view marketing sample

Page is never blocked.

Rendering is conditional, not restricted.

---

## Compliance Report Required JSON Fields

From Order metadata:

* EstimatedBalanceDueRange
* IRSAccountStatus
* IRS_Account_Status
* IRS_Status_Categories
* IRSNoticeReceived
* IRSNoticeDate
* IRSNoticeType
* IRSLienExposureLevel
* IRSAgentID
* IRSAgentName
* LastReturnFiledYear
* PrimaryRecommendedService
* TotalIRSBalance
* UnfiledReturnsIndicator

From ENV (organization identity):

* myOrganizationAddress
* myOrganizationBusinessLogo
* myOrganizationCity
* myOrganizationName
* myOrganizationStateProvince
* myOrganizationZip

These values are injected by Worker during render.

They are not stored in R2.

---

# Staff — Compliance Records (Form 10)

Internal operational form.

Title:
Tax Monitor Form 10 — Compliance Records

Purpose:

* Capture IRS call details
* Capture transcript retrieval
* Capture compliance indicators
* Capture revenue officer data
* Capture lien exposure level
* Capture recommended service
* Mark monitoring progress 100%

Submission:

POST → Worker → R2 → ClickUp

Hidden auto-fields:

* Tax_Monitoring_Service_Progress_Percent = 100
* Tax_Monitoring_Service_Progress_Status = "Monitoring records have been updated. Your report will be prepared."

Upon submission:

Worker must:

1. Write receipt
2. Update order metadata
3. Set:

   ```
   complianceSubmitted = true
   reportReady = true
   ```
4. Update ClickUp Order to status:
   "10 Compliance Records"

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

Out-of-order submissions must be rejected.

---

# Idempotency + Safety

* All events deduplicated by eventId
* Stripe Session ID used as payment dedupe key
* Forms require eventId
* No direct ClickUp writes before R2 update
* Stripe and Cal webhooks require signature validation
* Email triggers only occur after canonical state update
* Receipts are append-only

---

# Environment Variables (Worker)

Wrangler-only configuration.

Do not define runtime variables in dashboard.

---

## Bindings

* R2_BUCKET

---

## Secrets

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* GOOGLE_PRIVATE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

---

## Plaintext Vars

Alphabetical:

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

### Convention Rule

All Worker environment variables:

* Use UPPERCASE
* Use underscores
* No camelCase
* No mixed casing
* No dashboard-only overrides

These organization variables are required for compliance report rendering and are injected at render time by the Worker.

Organization identity values must exist in Wrangler config.

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

