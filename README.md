# Tax Monitor Pro (TMP)

## Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [Architecture Overview](#architecture-overview)
* [Ecosystem Overview](#ecosystem-overview)
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

Tax Monitor Pro provides a **taxpayer-facing discovery and monitoring system** designed to connect individuals with qualified tax professionals while enabling proactive compliance monitoring.

The system allows taxpayers to:

* locate qualified tax professionals through a searchable directory
* submit inquiries directly to professionals in the network
* receive member discounts and tier-based priority responses to inquiries (via call, direct messaging, email, or ticket)
* access educational tax tools and transcript analysis resources

TMP separates the **consumer experience** from the **professional infrastructure layer**, ensuring that public discovery functions remain lightweight while professional data and membership management remain centralized in Virtual Launch Pro.

---

# Key Features

Core capabilities include:

* directory search for tax professionals
* inquiry routing to professional profiles
* taxpayer monitoring memberships
* token access for tax tools
* integration with transcript diagnostics
* public discovery interface for professional services
* contract-driven API architecture
* R2-based canonical data storage

The platform emphasizes **proactive tax monitoring and early problem detection** rather than reactive resolution work.

---

# Architecture Overview

Tax Monitor Pro is built using a **Cloudflare Worker–centric architecture** where API logic runs at the edge and static front-end interfaces are served through Cloudflare Pages.

Core architectural principles include:

* canonical storage in R2
* contract-driven API validation
* stateless worker design
* deny-by-default routing
* cross-platform API communication

Primary system components include:

* Cloudflare Workers for API execution
* static front-end applications
* R2 canonical data storage
* D1 query indexes for search and filtering
* webhook ingestion pipelines

All write operations follow the canonical pipeline:

1. request received
2. contract validation
3. receipt stored in R2
4. canonical record written to R2
5. query indexes updated
6. response returned

This architecture ensures consistent contract enforcement and reliable data ownership.

---

# Ecosystem Overview

Tax Monitor Pro operates as part of a **four-platform ecosystem** designed to provide both taxpayer discovery and professional infrastructure.

Each platform performs a specific role.

| Platform               | Role                                              |
| ---------------------- | ------------------------------------------------- |
| Tax Monitor Pro        | taxpayer discovery and professional directory     |
| Tax Tools Arcade       | taxpayer education and discovery traffic          |
| Transcript Tax Monitor | transcript diagnostics and analysis               |
| Virtual Launch Pro     | professional infrastructure and membership system |

Data ownership is centralized using **R2 canonical storage**, while query-optimized datasets are maintained in **D1**.

Cross-platform communication occurs through **Cloudflare Worker APIs**.

---

# TMP Responsibilities

Tax Monitor Pro is responsible for:

* public professional directory
* taxpayer inquiry routing
* taxpayer memberships
* discovery traffic from educational tools
* connecting taxpayers with monitoring professionals

Professional profiles displayed in TMP originate from **Virtual Launch Pro canonical records**.

---

# TMP Worker Routes

## Directory Routes

```
GET /v1/directory/profiles
GET /v1/directory/profiles/{professional_id}
```

Purpose:

* retrieve professional listings
* support filtering and search
* power directory UI components

---

## Inquiry Routes

```
GET  /v1/inquiries/{inquiry_id}
GET  /v1/inquiries/by-professional/{professional_id}
POST /v1/inquiries
```

Purpose:

* create taxpayer inquiries
* retrieve inquiry history
* route inquiries to the selected professional
* provide inquiry data for analytics and dashboards

---

## Membership Routes

```
GET  /v1/memberships/{account_id}
POST /v1/memberships
```

Purpose:

* create taxpayer memberships
* determine monitoring entitlements
* verify membership access to services

---

# Canonical Storage

TMP records are stored in R2 using structured object paths.

Examples:

```
/r2/inquiries/{inquiry_id}.json
/r2/taxpayer_memberships/{membership_id}.json
```

R2 serves as the **authoritative data layer** for canonical records.

Query-optimized data may be mirrored into D1 for search and analytics.

---

# Cross-Platform Data Flow

The ecosystem operates as a discovery and infrastructure loop.

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

This structure allows each platform to remain specialized while sharing canonical records across the ecosystem.

---

# Repository Structure

Typical repository layout:

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

| Directory    | Description                          |
| ------------ | ------------------------------------ |
| `/app`       | authenticated application interfaces |
| `/assets`    | shared images, scripts, and styles   |
| `/contracts` | JSON API contracts                   |
| `/pages`     | workflow and onboarding pages        |
| `/partials`  | reusable UI components               |
| `/site`      | public marketing pages               |
| `/workers`   | Cloudflare Worker APIs               |

---

# Environment Setup

Required software:

* Git
* Node.js
* Wrangler CLI

Typical setup process:

1. clone the repository
2. install dependencies
3. configure environment variables
4. run local worker environment
5. test API endpoints

---

# Deployment

Deployment occurs through **Cloudflare Workers** using Wrangler.

Example command:

```
wrangler deploy
```

The `wrangler.toml` configuration defines:

* compatibility date
* environment bindings
* R2 bucket access
* worker settings

---

# Contracts or Data Model

TMP uses **contract-driven APIs**.

Contracts define the relationship between:

* UI forms
* worker routes
* R2 canonical storage
* query indexes

Typical write lifecycle:

```
client request
→ contract validation
→ receipt written to R2
→ canonical record written
→ query indexes updated
→ response returned
```

This approach ensures predictable API behavior and stable integrations.

---

# Development Standards

Repository development standards include:

* alphabetical route documentation
* canonical Worker header structure
* contract-first API design
* deny-by-default routing
* R2 as the authoritative data source

Workers should use the standardized header format documenting inbound routes and invariants. 

---

# Integrations

External integrations include:

* Cloudflare infrastructure
* Google Workspace email services
* Stripe billing services
* Virtual Launch Pro APIs
* transcript diagnostic services

These integrations support authentication, billing, notifications, and professional infrastructure.

---

# Security and Secrets

Secrets must never be stored in the repository.

Sensitive configuration is handled through:

* Wrangler secret management
* environment variables
* webhook signing secrets
* OAuth credentials

Example secrets include:

* Stripe webhook signing secret
* API access tokens
* OAuth client secrets

---

# Contribution Guidelines

Recommended workflow:

1. create a feature branch
2. implement changes
3. test locally
4. verify contracts and routes
5. submit pull request
6. deploy after review

Changes that affect contracts or worker routes should be documented before merging.

---

# License

This repository is **proprietary software** owned by Tax Monitor Pro / Virtual Launch Pro.

Unauthorized distribution, modification, or commercial use is not permitted.

---
