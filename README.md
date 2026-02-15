# Tax Monitor Pro App

Tax Monitor Pro is a serverless CRM + delivery system for proactive IRS monitoring and compliance reporting.

This system is built on:

* Cloudflare Pages (UI)
* Cloudflare Workers (API + orchestration)
* Cloudflare R2 (canonical authority)
* ClickUp (projection layer only)
* Stripe (payments)
* Cal.com (appointments)
* Google Workspace (outbound email only)

R2 is the authority. ClickUp is a projection.

---

# Architecture Overview

Cloudflare Pages (Portal + Marketing UI)
↓ (form POST / webhook)
Cloudflare Worker (API + orchestration + validation)
↓
R2 (canonical storage + receipts)
↓
ClickUp (projection layer)

---

# Core Principle

## R2 is authority

Every inbound event must:

1. Write append-only receipt
   `receipts/{source}/{eventId}.json`

2. Upsert canonical object
   `orders/{orderId}.json`
   `accounts/{accountId}.json`
   `support/{supportId}.json`

3. Then update ClickUp

ClickUp must never be written before canonical state is updated.

---

# Lifecycle Model

## Phase 0 — Lead Capture, Intake & Payment

1. Intake
2. Offer
3. Agreement
4. Payment

Automation only. No operator involvement.

---

## Phase 1 — ESign 2848 / Review

5. Welcome
6. Filing Status
7. Address Update
8. eSign 2848

Operator involvement begins only after:

`stepBooleans.esign2848Submitted = true`

---

## Phase 2 — Processing / Due Diligence

9. Authorization + CAF
10. Record Retrieval + Analysis

Operator responsibilities:

* Review 2848
* Submit to CAF / IRS
* Verify authorization
* Handle rejection loops
* Retrieve transcripts
* Analyze compliance data

Authorization unlock rule:

```
cafVerified === true
OR
wetSignatureVerified === true
```

---

## Phase 3 — Tax Record / Discuss Results

11. Compliance Report
12. Results Appointment
13. Exit Survey
14. Support Ticket

Report ready when:

```
reportReady === true
```

---

# Operator Boundary

Operator begins work only after eSign 2848 submission.

Operator never:

* Builds 2848 manually
* Creates Orders manually
* Updates ClickUp as source of truth
* Tracks status in comments

All state lives in R2 canonical.

---

# Canonical Order Model (R2)

Example:

```json
{
  "orderId": "ord_...",
  "accountId": "acct_...",
  "stepBooleans": {
    "addressUpdateSubmitted": false,
    "agreementAccepted": false,
    "complianceSubmitted": false,
    "esign2848Submitted": false,
    "filingStatusSubmitted": false,
    "intakeComplete": false,
    "offerAccepted": false,
    "paymentCompleted": false,
    "reportReady": false,
    "welcomeConfirmed": false
  },
  "ops": {
    "cafSubmitted": false,
    "cafVerified": false,
    "esign2848PdfKey": null,
    "esign2848PdfUrl": null,
    "wetSignaturePdfKey": null,
    "wetSignaturePdfUrl": null,
    "wetSignatureRequired": false,
    "wetSignatureVerified": false
  },
  "authorization": {
    "cafActive": false,
    "cafNumber": null,
    "cafVerifiedDate": null,
    "poaEffectiveDate": null,
    "repFullName": null,
    "repPtin": null,
    "taxMattersAuthorized": null
  }
}
```

---

# Artifact Storage (R2)

Templates:

```
templates/2848/page2-signed.pdf
```

Generated artifacts:

```
orders/{orderId}/artifacts/2848/esigned.pdf
orders/{orderId}/artifacts/2848/wet-signed.pdf
orders/{orderId}/artifacts/compliance-report/latest.pdf
```

Compliance PDF URL is written to Orders task CF:
`Order Compliance Report PDF URL`
Field ID:
`3c4c2986-c8df-47b7-a676-258333c71558`

---

# Endpoints

Worker Base:

```
https://api.taxmonitor.pro
```

## Read

```
GET /orders/{orderId}
```

## Form Submissions

```
POST /forms/intake
POST /forms/offer
POST /forms/agreement
POST /forms/payment
POST /forms/post-payment/welcome
POST /forms/post-payment/filing-status
POST /forms/post-payment/address-update
POST /forms/post-payment/esign-2848
POST /forms/post-payment/compliance-report
POST /forms/post-payment/client-exit-survey
POST /forms/staff/compliance-records
POST /forms/support/ticket
```

All forms must POST to absolute Worker URLs.

---

# Security & PPI Rules

* No public PPI in logs
* Never log raw SSN/DOB
* UI masks SSN by default
* Client endpoints are token-gated
* Staff endpoints require authentication (deny-by-default if mechanism not configured)
* Webhooks must validate signatures (Stripe + Cal)

Google Workspace is outbound-only. No inbound email ingestion at launch.

---

# Repository Structure

```
taxmonitor.pro-site/
├─ .gitattributes
├─ .gitignore
├─ README.md
├─ _redirects
├─ build.mjs
├─ app/
│  ├─ agreement.html
│  ├─ index.html
│  ├─ intake.html
│  ├─ login.html
│  ├─ offer.html
│  ├─ payment.html
│  ├─ payment-success.html
│  ├─ contracts/
│  │  ├─ clickup/
│  │  │  ├─ accounts.list.contract.json
│  │  │  ├─ orders.list.contract.json
│  │  │  └─ support.list.contract.json
│  │  ├─ forms/
│  │  │  └─ post-payment/
│  │  └─ staff/
│  │     └─ compliance-records.contract.json
│  │  └─ contract-registry.json
│  ├─ pages/
│  │  ├─ flows/
│  │  │  ├─ intake/
│  │  │  └─ post-payment/
│  │  └─ staff/
│  └─ partials/
├─ assets/
├─ legal/
├─ public/
├─ site/
│  ├─ partials/
│  └─ resources/
├─ styles/
└─ workers/
   └─ api/
      ├─ wrangler.toml
      └─ src/
         └─ index.js