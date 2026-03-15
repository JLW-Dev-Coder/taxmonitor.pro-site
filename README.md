# Tax Monitor Pro (TMP)

## Table of Contents

* [Architecture Overview](#architecture-overview)
* [Canonical Storage](#canonical-storage)
* [Contracts or Data Model](#contracts-or-data-model)
* [Contribution Guidelines](#contribution-guidelines)
* [Deployment](#deployment)
* [Development Standards](#development-standards)
* [Environment Setup](#environment-setup)
* [Integrations](#integrations)
* [Key Features](#key-features)
* [License](#license)
* [Overview](#overview)
* [Repository Structure](#repository-structure)
* [Security and Secrets](#security-and-secrets)
* [Worker API Surface](#worker-api-surface)

---

# Overview

Tax Monitor Pro (TMP) is the **taxpayer discovery and membership platform** within the Virtual Launch Pro ecosystem.

TMP connects taxpayers to tax professionals while providing a structured system for:

* taxpayer discovery
* professional directory browsing
* service inquiry routing
* taxpayer memberships
* taxpayer dashboards

Tax Monitor Pro is intentionally limited in scope.

It **does not manage professional infrastructure or transcript diagnostics**. Those responsibilities belong to other platforms in the ecosystem. 

---

# Key Features

Core TMP capabilities include:

* professional directory search
* taxpayer discovery intake flows
* inquiry routing to tax professionals
* taxpayer account management
* taxpayer memberships (Free, Essential, Plus, Premier)
* taxpayer dashboards
* Stripe membership billing
* notification preferences
* support ticket handling

TMP provides the **entry point for taxpayers** entering the broader tax service ecosystem.

---

# Architecture Overview

TMP operates on **Cloudflare edge infrastructure** using a contract-driven architecture.

Core architectural principles:

* canonical storage in **R2**
* contract-first API validation
* stateless Cloudflare Workers
* deny-by-default routing
* write-first canonical storage

Canonical write pipeline:

```
1 request received
2 contract validation
3 receipt stored in R2
4 canonical record updated
5 D1 index projection
6 response returned
```

This design ensures that **R2 remains the authoritative data source**.

---

# Canonical Storage

TMP owns a limited set of canonical records.

```
/r2/inquiries/{inquiry_id}.json
/r2/taxpayer_accounts/{account_id}.json
/r2/taxpayer_memberships/{membership_id}.json
```

These records represent the core TMP entities:

| Entity               | Description                     |
| -------------------- | ------------------------------- |
| inquiries            | taxpayer service requests       |
| taxpayer_accounts    | authenticated taxpayer profiles |
| taxpayer_memberships | membership subscriptions        |

All write operations update these canonical objects before any projections occur.

---

# Worker API Surface

TMP exposes taxpayer-facing APIs through a Cloudflare Worker.

## Health

```
GET /health
```

---

## Membership and Billing

```
GET  /v1/pricing
GET  /v1/checkout/status
POST /v1/checkout/sessions
POST /v1/webhooks/stripe
```

These routes support TMP membership creation and Stripe billing.

---

## Authentication

```
GET  /v1/auth/google/callback
GET  /v1/auth/google/start
GET  /v1/auth/magic-link/verify
GET  /v1/auth/session
GET  /v1/auth/sso/oidc/callback
GET  /v1/auth/sso/oidc/start
GET  /v1/auth/sso/saml/start
POST /v1/auth/logout
POST /v1/auth/magic-link/request
POST /v1/auth/sso/saml/acs
```

Authentication supports:

* Google OAuth
* magic links
* SSO
* session retrieval

---

## Two-Factor Authentication

```
GET  /v1/auth/2fa/status/{account_id}
POST /v1/auth/2fa/challenge/verify
POST /v1/auth/2fa/disable
POST /v1/auth/2fa/enroll/init
POST /v1/auth/2fa/enroll/verify
```

---

## Directory

```
GET /v1/directory/professionals
GET /v1/directory/professionals/{professional_id}
```

Directory data originates from **Virtual Launch Pro professional records**.

---

## Inquiries

```
GET  /v1/inquiries/{inquiry_id}
GET  /v1/inquiries/by-account/{account_id}
POST /v1/inquiries
```

These routes support taxpayer service requests routed to professionals.

---

## Taxpayer Accounts

```
GET   /v1/taxpayer-accounts/{account_id}
PATCH /v1/taxpayer-accounts/{account_id}
```

These APIs manage the taxpayer profile used by TMP dashboards.

---

## Taxpayer Memberships

```
GET   /v1/taxpayer-memberships/{membership_id}
GET   /v1/taxpayer-memberships/by-account/{account_id}
POST  /v1/taxpayer-memberships/free
PATCH /v1/taxpayer-memberships/{membership_id}
```

Membership records are stored in canonical R2 storage.

---

## Notifications

```
GET   /v1/notifications/in-app
GET   /v1/notifications/preferences/{account_id}
PATCH /v1/notifications/preferences/{account_id}
POST  /v1/notifications/in-app
POST  /v1/notifications/sms/send
POST  /v1/webhooks/twilio
```

These routes support taxpayer communication preferences and alerts.

---

## Support

```
GET   /v1/support/tickets/{ticket_id}
GET   /v1/support/tickets/by-account/{account_id}
PATCH /v1/support/tickets/{ticket_id}
POST  /v1/support/tickets
```

Support tickets allow taxpayers to contact the platform support team.

---

# Contracts or Data Model

TMP uses **contract-driven API validation**.

Each API route is backed by a JSON contract describing:

* request structure
* validation rules
* response structure
* canonical storage mapping

Example contract inventory:

```
tmp.directory.search.v1.json
tmp.inquiry.create.v1.json
tmp.inquiry.get.v1.json
tmp.inquiry.list-by-account.v1.json
tmp.membership.checkout-session.create.v1.json
tmp.membership.checkout-status.get.v1.json
tmp.membership.free.create.v1.json
tmp.membership.get.v1.json
tmp.membership.list-by-account.v1.json
tmp.taxpayer-account.get.v1.json
tmp.taxpayer-account.update.v1.json
tmp.auth.session.get.v1.json
tmp.auth.magic-link.request.v1.json
tmp.auth.magic-link.verify.v1.json
tmp.auth.google.start.v1.json
tmp.auth.google.callback.v1.json
tmp.auth.logout.v1.json
tmp.notifications.preferences.get.v1.json
tmp.notifications.preferences.patch.v1.json
tmp.notifications.in-app.list.v1.json
tmp.notifications.in-app.create.v1.json
tmp.support.ticket.create.v1.json
tmp.support.ticket.get.v1.json
tmp.support.ticket.list-by-account.v1.json
tmp.support.ticket.patch.v1.json
```

Contracts enforce **data integrity before canonical records are modified**.

---

# Repository Structure

Typical TMP repository layout:

```
/app
/assets
/contracts
/pages
/partials
/site
/workers
```

Directory purposes:

| Directory    | Purpose                    |
| ------------ | -------------------------- |
| `/app`       | taxpayer dashboard UI      |
| `/assets`    | shared static assets       |
| `/contracts` | API contract schemas       |
| `/pages`     | intake and discovery flows |
| `/partials`  | shared UI components       |
| `/site`      | public marketing pages     |
| `/workers`   | TMP Cloudflare Worker APIs |

---

# Environment Setup

Required tools:

* Git
* Node.js
* Wrangler CLI

Setup process:

```
1 clone repository
2 configure environment variables
3 install dependencies
4 start local worker environment
```

---

# Deployment

TMP APIs deploy through **Cloudflare Workers**.

Deployment command:

```
wrangler deploy
```

Deployment configuration is defined in `wrangler.toml`.

---

# Integrations

TMP integrates with several external services:

* Cloudflare Workers
* Cloudflare R2 storage
* Cloudflare D1 database
* Google OAuth
* magic-link authentication
* Stripe subscriptions
* Twilio notifications

---

# Development Standards

Development rules include:

* contract-first API development
* alphabetical route documentation
* canonical worker headers
* minimal changes to core contract surfaces
* deny-by-default routing

Workers should remain **stateless and contract-safe**.

---

# Security and Secrets

Sensitive values are managed through **Wrangler secret management**.

Examples include:

* Stripe webhook secrets
* OAuth client secrets
* email API tokens
* session signing keys

Secrets must never be committed to the repository.

---

# Contribution Guidelines

Recommended workflow:

```
1 create branch
2 implement changes
3 test locally
4 submit pull request
```

All changes affecting APIs should update:

* route documentation
* relevant contracts
* README sections if necessary

---

# License

This repository is proprietary software owned and maintained by **Virtual Launch Pro**.

Unauthorized redistribution or modification is prohibited.

---
