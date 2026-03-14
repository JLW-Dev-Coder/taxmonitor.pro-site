# Tax Monitor Pro (TMP)

# Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [Architecture Overview](#architecture-overview)
* [Ecosystem Role](#ecosystem-role)
* [Worker Routes](#worker-routes)
* [Canonical Storage](#canonical-storage)
* [Repository Structure](#repository-structure)
* [Environment Setup](#environment-setup)
* [Deployment](#deployment)
* [Contracts or Data Model](#contracts-or-data-model)
* [Development Standards](#development-standards)
* [Integrations](#integrations)
* [Security and Secrets](#security-and-secrets)
* [Contribution Guidelines](#contribution-guidelines)
* [License](#license)

---

# Overview

Tax Monitor Pro (TMP) is the **taxpayer discovery and membership platform** within the Virtual Launch Pro ecosystem.

The platform connects taxpayers with tax professionals and manages the taxpayer side of the system including:

* taxpayer memberships
* professional directory discovery
* inquiry routing
* taxpayer dashboards
* transcript and tool access

TMP is the **primary entry point for taxpayers** entering the ecosystem.

---

# Key Features

Major capabilities include:

* professional discovery directory
* taxpayer account management
* taxpayer membership subscriptions
* inquiry routing to professionals
* taxpayer dashboard interface
* token balances for tools and transcripts
* transcript job monitoring
* tool usage history

---

# Architecture Overview

TMP runs on **Cloudflare edge infrastructure**.

Core components include:

* Cloudflare Workers
* R2 canonical storage
* D1 query database
* static frontend dashboard
* webhook processing pipelines

Write pipeline:

```
1 request received
2 contract validation
3 receipt stored in R2
4 canonical record updated
5 D1 index updated
6 response returned
```

Canonical storage always precedes projection.

---

# Ecosystem Role

TMP acts as the **taxpayer platform** within the ecosystem.

System flow:

```
Tax Tools Arcade
→ generates discovery traffic

Transcript Tax Monitor
→ provides transcript diagnostics

Tax Monitor Pro
→ connects taxpayers with professionals

Virtual Launch Pro
→ manages professional infrastructure
```

Professional profiles displayed in TMP originate from **VLP canonical records**.

---

# Worker Routes

Directory

```
GET /v1/directory/profiles
GET /v1/directory/profiles/{professional_id}
```

Inquiries

```
GET  /v1/inquiries/{inquiry_id}
GET  /v1/inquiries/by-professional/{professional_id}
POST /v1/inquiries
```

Taxpayer Accounts

```
GET   /v1/taxpayers/{account_id}
PATCH /v1/taxpayers/{account_id}
POST  /v1/taxpayers
```

Taxpayer Membership

```
GET /v1/taxpayer-memberships/{membership_id}
GET /v1/taxpayer-memberships/by-account/{account_id}
```

Token Access

```
GET /vlp/v1/tokens/{account_id}
GET /vlp/v1/tokens/{account_id}/tools
GET /vlp/v1/tokens/{account_id}/transcripts
```

---

# Canonical Storage

```
/r2/inquiries/{inquiry_id}.json
/r2/taxpayer_accounts/{account_id}.json
/r2/taxpayer_memberships/{membership_id}.json
```

R2 is the **authoritative storage layer**.

D1 stores indexes for:

* directory filtering
* membership lookup
* dashboard queries

---

# Repository Structure

```
/app
/assets
/contracts
/pages
/partials
/site
/workers
```

Descriptions:

* `/app` taxpayer dashboard interface
* `/assets` shared resources
* `/contracts` API validation schemas
* `/pages` workflow pages
* `/partials` reusable UI components
* `/site` marketing pages
* `/workers` Cloudflare Worker APIs

---

# Environment Setup

Required tools:

* Git
* Node.js
* Wrangler CLI

Setup:

```
git clone repo
npm install
wrangler dev
```

Configure required environment variables before running workers.

---

# Deployment

Deployment occurs through Cloudflare Workers.

```
wrangler deploy
```

The `wrangler.toml` file defines:

* environment bindings
* R2 bucket bindings
* compatibility date
* secrets configuration

---

# Contracts or Data Model

All APIs follow **contract-driven validation**.

Contracts define:

* request schemas
* canonical R2 storage paths
* D1 projection rules

Every mutation request must pass contract validation.

---

# Development Standards

Standards include:

* alphabetical route documentation
* canonical Worker headers
* deny-by-default routing
* R2 canonical write-first rule

---

# Integrations

External systems include:

* Virtual Launch Pro APIs
* Stripe subscriptions
* Cloudflare infrastructure
* Google authentication

---

# Security and Secrets

Secrets are managed through Wrangler:

```
wrangler secret put
```

Examples:

* Stripe webhook secret
* OAuth secrets
* API tokens

Secrets must never be committed to the repository.

---

# Contribution Guidelines

Recommended workflow:

```
1 create branch
2 implement change
3 test locally
4 submit pull request
```

---

# License

Proprietary software owned by Virtual Launch Pro.

---
