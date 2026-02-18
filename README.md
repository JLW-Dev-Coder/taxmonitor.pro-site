# README.md

# [README.md](http://README.md)

# Tax Monitor Pro
Serverless · Contract-Driven · Idempotent · Event-Driven
* * *

## Table of Contents (Alphabetical)
*   Authentication Model
*   ClickUp Projection Layer
*   Contracts (Source of Truth)
*   Core Stack
*   Data Model (R2 Canonical Authority)
*   Domains & Routing
*   Event Trigger System
*   Idempotency & Safety
*   Operational Checklist
*   Processing Contract (Write Order)
*   Repository Structure (Exact Tree)
*   Security & Legal Controls
*   Staff Compliance Records Gate
*   System Architecture
*   What Tax Monitor Pro Is
*   2848 Two-Signature Sequence
* * *

# Authentication Model
Supported:
*   Google OAuth
*   Magic Link
*   SSO (SAML/OIDC)

Endpoints (Alphabetical):

```perl
POST /auth/google
GET  /auth/google/callback
POST /auth/logout
POST /auth/magic-link/request
POST /auth/magic-link/verify
POST /auth/sso/callback
POST /auth/sso/init
GET  /auth/session
```

All login events:
*   Write login receipt
*   Upsert canonical account
*   Update lastLoginAt
*   Issue HTTP-only secure cookie

Stored in:

```css
accounts/{accountId}.json
auth: {
  provider,
  lastLoginAt,
  lastActiveAt
}
```

* * *

# ClickUp Projection Layer
List IDs:
Accounts — 901710909567
Orders — 901710818340
Support — 901710818377
ClickUp is never authoritative.
* * *

# Contracts (Source of Truth)
All workflows are governed by versioned JSON contracts.
Validation Rules:
*   Strict enum enforcement
*   rejectUnknownValues = true
*   normalizeCheckboxToBoolean = true
*   No hardcoded dropdown options in HTML
*   No inferred business logic from UI

Contracts are versioned and enforced by the Worker.
* * *

# Core Stack (Alphabetical)
*   [Cal.com](http://Cal.com) — Appointment booking webhooks
    *   Webhooks:
      *   BOOKING\_CANCELLED
      *   BOOKING\_CREATED
      *   BOOKING\_RESCHEDULED
    *   Endpoint:
      *   https://api.taxmonitor.pro/cal/webhook
*   ClickUp — Human execution layer (projection only)
*   Cloudflare Pages — UI (portal + marketing)
*   Cloudflare R2 — Canonical authority + append-only receipts
*   Cloudflare Worker — API, orchestration, validation
*   Google Workspace — Transactional email (only permitted email system)
*   Stripe — Payment webhooks
    *   Webhooks:
      *   checkout.session.completed
      *   payment\_intent.succeeded
    *   Endpoint:
      *   https://api.taxmonitor.pro/stripe/webhook
* * *

# Data Model (R2 Canonical Authority)

```bash
accounts/{accountId}.json
orders/{orderId}.json
support/{supportId}.json
receipts/{source}/{eventId}.json
```

Receipts are immutable ledger entries.
* * *

# Domains & Routing
UI Domain:

Serves:
*   `/app/*`
*   `/site/*`

API Domain:

Route:

```plain
api.taxmonitor.pro/*
```

All forms must POST to absolute URLs:
No relative form actions allowed.
* * *

# Event Trigger System
Final Trigger Set (Alphabetical):
*   Appt
*   Email
*   Form
*   Login
*   Message
*   Payment
*   Task
*   Visit

Trigger Sources:

Appt → [Cal.com](http://Cal.com) webhook
Email → Google Workspace outbound (post-canonical)
Form → All portal + staff submissions
Login → Auth endpoints
Message → In-app + logged outbound
Payment → Stripe webhook
Task → ClickUp webhook
Visit → Client-side beacon

All triggers:
Worker → Receipt → Canonical Upsert → ClickUp Projection → Optional Email
* * *

# Idempotency & Safety
*   Every event must include eventId
*   Stripe dedupe key: Stripe Session ID
*   Cal dedupe key: Cal event ID
*   Receipt written before canonical change
*   No duplicate tasks
*   No duplicate emails
*   Retry-safe processing
* * *

# Operational Checklist
*   All forms POST to absolute Worker URLs
*   Every event includes eventId
*   Receipt written before state change
*   Canonical upsert before ClickUp update
*   Emails sent only after canonical update
*   Contracts versioned and enforced
*   Login writes receipt
*   2848 state machine enforced
* * *

# Processing Contract (Write Order)
For every inbound event:
1. Validate signature (if webhook)
2. Validate payload against contract
3. Write append-only receipt:
4. `receipts/{source}/{eventId}.json`
5. Upsert canonical object
6. Update ClickUp
7. Send email (if required)

If receipt exists → exit safely.
* * *

# Repository Structure (Exact Tree)
**This structure is authoritative and must not be modified without updating this file.**

```dpr
.
app/
├─ contracts/
│  ├─ clickup/
│  │  ├─ accounts.list.contract.json
│  │  ├─ orders.list.contract.json
│  │  └─ support.list.contract.json
│  ├─ forms/
│  │  └─ post-payment/
│  │     ├─ address-update.contract.json
│  │     ├─ client-exit-survey.contract.json
│  │     ├─ compliance-report.contract.json
│  │     ├─ esign-2848.contract.json
│  │     ├─ filing-status.contract.json
│  │     └─ welcome.contract.json
│  ├─ staff/
│  │  └─ compliance-records.contract.json
│  ├─ webhooks/
│  │  ├─ cal.booking_cancelled.contract.json
│  │  ├─ cal.booking_created.contract.json
│  │  ├─ cal.booking_rescheduled.contract.json
│  │  ├─ stripe.checkout_session_completed.contract.json
│  │  └─ stripe.payment_intent_succeeded.contract.json
│  ├─ contract-registry.json
│  ├─ tm_compliance_record.v2.example.json
│  └─ webhook-registry.json
│  ├─ pages/
│  │  ├─ calendar.html
│  │  ├─ files.html
│  │  ├─ flows/
│  │  │  ├─ intake/
│  │  │  │  ├─ agreement.html
│  │  │  │  ├─ intake.html
│  │  │  │  ├─ offer.html
│  │  │  │  └─ payment.html
│  │  │  └─ post-payment/
│  │  │     ├─ welcome.html
│  │  │     ├─ filing-status.html
│  │  │     ├─ address-update.html
│  │  │     ├─ esign-2848.html
│  │  │     ├─ compliance-report.html
│  │  │     └─ client-exit-survey.html
│  │  ├─ messaging.html
│  │  ├─ office.html
│  │  ├─ projects.html
│  │  ├─ staff/
│  │     └─ compliance-records.html
│  │  └─ support.html
│  ├─ partials/
│  │  ├─ sidebar.html
│  │  └─ topbar.html
│  ├─ agreement.html
│  ├─ index.html
│  ├─ intake.html
│  ├─ login.html
│  ├─ offer.html
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
├─ .gitattributes
├─ .gitignore
├─ build.mjs
├─ MARKET.md
├─ README.md
├─ _redirects
```

Rules:
*   All JSON contracts live in `app/contracts/`
*   UI flows live in `app/pages/`
*   Worker code lives in `workers/api/src/`
*   Cloudflare config lives in `workers/api/wrangler.toml`
*   Static assets live in `assets/`
*   Public marketing content lives in `site/`
*   Legal docs live in `legal/`
*   Styles live in `styles/`
*   Remove legacy folders (e.g., dist/) if unused
* * *

# Security & Legal Controls
*   Deny-by-default endpoints
*   Webhook signature validation (Stripe + Cal)
*   No secrets in client payloads
*   PII masked in UI
*   No raw SSN logging
*   R2 is authority
*   ClickUp holds projection only
* * *

# Staff Compliance Records Gate
Endpoint:

```elixir
POST https://api.taxmonitor.pro/forms/staff/compliance-records
```

Validates against:

```plain
app/contracts/staff/compliance-records.contract.json
```

On final submission:
*   complianceSubmitted = true
*   reportReady = true

ClickUp status updated to:

10 Compliance Records
* * *

# System Architecture
Presentation Layer
Cloudflare Pages serves:
*   `/app/*`
*   `/site/*`

Logic Layer

Cloudflare Worker:
*   Validates inbound events
*   Writes receipts
*   Upserts canonical objects
*   Projects to ClickUp
*   Sends email (after canonical update only)

Storage Layer

Cloudflare R2:
*   Canonical objects
*   Append-only receipt ledger

Execution Layer

ClickUp:
*   Accounts list
*   Orders list
*   Support list
* * *

# What Tax Monitor Pro Is
Tax Monitor Pro is a **serverless CRM + delivery system for tax monitoring services**.
It is:
*   Contract-driven
*   Idempotent
*   Event-driven
*   Worker-first
*   R2-authoritative

HTML never defines valid data.
JSON contracts define valid data.
* * *

# 2848 Two-Signature Sequence
Both signatures occur on Page 2.
Sequence:
1. Generate Page 1 + Page 2
2. Taxpayer signs Page 2
3. Representative signs Page 2
4. Store final signed PDF in R2

Canonical fields:
*   esign2848Status (draft | taxpayer\_signed | fully\_signed)
*   esign2848TaxpayerSignedAt
*   esign2848RepresentativeSignedAt
*   esign2848UrlTaxpayerSignedPdf
*   esign2848UrlFinalPdf

# Variables and Secrets
Define the environment variables and secrets for your Worker used at runtime

Secret
CAL_WEBHOOK_SECRET
Value encrypted


Plaintext
CLICKUP_ACCOUNTS_LIST_ID
901710909567


Secret
CLICKUP_API_KEY
Value encrypted


Plaintext
CLICKUP_ORDERS_LIST_ID
901710818340


Plaintext
CLICKUP_SUPPORT_LIST_ID
901710818377


Plaintext
GOOGLE_CLIENT_EMAIL
tax-monitor-worker@tax-monitor-pro.iam.gserviceaccount.com


Secret
GOOGLE_PRIVATE_KEY
Value encrypted


Plaintext
GOOGLE_TOKEN_URI
https://oauth2.googleapis.com/token


Plaintext
GOOGLE_WORKSPACE_USER_INFO
info@taxmonitor.pro


Plaintext
GOOGLE_WORKSPACE_USER_NO_REPLY
no-reply@taxmonitor.pro


Plaintext
GOOGLE_WORKSPACE_USER_SUPPORT
support@taxmonitor.pro


Plaintext
MY_ORGANIZATION_ADDRESS
1175 Avocado Avenue Suite 101 PMB 1010


Plaintext
MY_ORGANIZATION_BUSINESS_LOGO
https://taxmonitor.pro/assets/logo.svg


Plaintext
MY_ORGANIZATION_CITY
El Cajon


Plaintext
MY_ORGANIZATION_NAME
Tax Monitor Pro


Plaintext
MY_ORGANIZATION_STATE_PROVINCE
CA


Plaintext
MY_ORGANIZATION_ZIP
92020


Secret
STRIPE_SECRET_KEY
Value encrypted


Secret
STRIPE_WEBHOOK_SECRET
Value encrypted

Yes. You *can* make the **Agreement page** hand the Worker enough data to generate a “signed” agreement PDF (where “signed” = user explicitly acknowledged + identifying info + timestamp), **store it in R2**, and then **project the download URL into ClickUp CF** `Order Agreement Signed PDF URL` (`b156f6bd-9697-429f-a651-43e2ad12a87a`).

Humans love pretending a checkbox is a signature. We can at least make it auditable.

---

## What to change on the Agreement page

### 1) Add two hidden fields (and optionally two visible fields)

Your page currently submits only:

* `agreement_acknowledged` (`Yes|No`)
* `code`
* `eventId`
* `item`
* `sessionToken`

To generate a defensible PDF, add:

* `signer_name` (typed name)
* `signed_at` (ISO timestamp)

**HTML (inside the `<form id="tm-agreement">`)**

```html
<input id="signer_name" name="signer_name" type="hidden" value="">
<input id="signed_at" name="signed_at" type="hidden" value="">
```

If you want it stronger, add a visible typed-name field (recommended):

```html
<label class="block text-sm text-slate-300 mt-4">
  Type your full legal name
  <input id="signer_name_input" type="text"
    class="mt-2 w-full rounded-xl bg-slate-950/20 border border-slate-700/70 px-4 py-3 text-slate-100"
    placeholder="Full legal name" autocomplete="name">
</label>
```

### 2) Set them right before submit

In your existing submit handler (right before `fetch`), add:

```js
var signerHidden = document.getElementById("signer_name");
var signerInput = document.getElementById("signer_name_input");
var signedAt = document.getElementById("signed_at");

if (signerHidden) signerHidden.value = (signerInput && signerInput.value) ? signerInput.value.trim() : "";
if (signedAt) signedAt.value = new Date().toISOString();
```

### 3) Accept Worker’s PDF response (without breaking your redirect)

Have the Worker return:

```json
{
  "ok": true,
  "agreementPdfUrl": "https://api.taxmonitor.pro/download/....pdf"
}
```

Then store it client-side for later (optional) and continue redirect:

```js
if (res.ok && data && data.ok) {
  if (data.agreementPdfUrl) sessionStorage.setItem("tm:agreementPdfUrl", data.agreementPdfUrl);
  window.location.href = "/app/payment.html" + (window.location.search || "");
  return;
}
```

---

## What to change in the Agreement ingestion contract

Your Agreement contract should include the new fields:

* `signer_name`
* `signed_at`

And (important) keep `agreement_acknowledged` as `"Yes" | "No"` (your page sets it that way).

Add to `payload.required` (alphabetical is cute, but correctness first):

* `signed_at`
* `signer_name`

Add to `payload.properties`:

```json
"signed_at": { "type": "string", "format": "date-time" },
"signer_name": { "type": "string", "minLength": 1, "maxLength": 160 }
```

And update effects so canonical captures it:

```json
"agreement": {
  "acknowledged": "{payload.agreement_acknowledged}",
  "code": "{payload.code}",
  "item": "{payload.item}",
  "signedAt": "{payload.signed_at}",
  "signerName": "{payload.signer_name}"
}
```

---

## What the Worker must do

### 1) Generate the PDF inside the Worker

Cloudflare Workers can’t run headless Chrome, so “render this HTML to PDF” is not happening natively.

Do this instead:

* Use a pure-JS PDF generator library (common choice: `pdf-lib`)
* Create a clean PDF layout (title + agreement text + signature block)
* Embed:

  * `signer_name`
  * `signed_at`
  * `sessionToken` (optional)
  * `eventId` (audit trail)

### 2) Store it in R2 and patch canonical

Write the PDF bytes to R2, something like:

* `artifacts/orders/{orderId}/agreement-signed.pdf`

Then patch orders canonical:

* `ordersPatch.artifacts.orderAgreementSignedPdfR2Key = <that r2Key>`
* `ordersPatch.stepBooleans.agreementAccepted = true` (you already do)
* (Optional) store signer metadata under `orders.agreement.*`

### 3) Project to ClickUp using your CF

After R2 update, set the ClickUp field:

* CF: `b156f6bd-9697-429f-a651-43e2ad12a87a`
* Value: Worker-generated **download URL** derived from R2 key

Example projection rule (conceptually):

* `from: effects.ordersPatch.artifacts.orderAgreementSignedPdfR2Key`
* `transform: r2KeyToDownloadUrl`
* `fieldId: b156f6bd-9697-429f-a651-43e2ad12a87a`

### 4) Return JSON to the page

Return:

```json
{ "ok": true, "agreementPdfUrl": "<download url>" }
```

So the page can optionally surface it.

---

## One dependency you must confirm (because it controls correctness)

**Can you confirm whether `/forms/agreement` already knows the `orderId` at submit time?**

Right now, the Agreement form submits `code`, `item`, `sessionToken`, `eventId`. I don’t see an `orderId` input in the page HTML you shared earlier, which means the Worker must derive `orderId` from `sessionToken` (or `code`, or something else). If the Worker can’t deterministically map to an order, the PDF can’t be attached to the right canonical order or ClickUp task.

If your mapping is “sessionToken → orderId”, we’re good and this becomes straightforward.

---

If you upload `offer.html` and `payment.html`, I’ll line up Forms 2 and 4 the same way (and we’ll stop having three contract dialects arguing in your repo like it’s a family holiday).
