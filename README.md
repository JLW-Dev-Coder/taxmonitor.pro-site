# Tax Monitor Pro

Production repo for the Tax Monitor Pro site and supporting Cloudflare Workers.

This README documents **how to redeploy** when a build or Worker fails.

---

## Architecture

- **Cloudflare Pages**
  - Hosts the marketing site and app shell
  - Auto-deploys from GitHub on push
- **Cloudflare Workers**
  - Handles API, checkout, and service logic
  - Deployed either via Dashboard or Wrangler

---

## Repo Structure

Alphabetical (minimal, expandable):

app/
│
├─ agreement.html
├─ index.html
├─ intake.html
├─ offer.html
├─ payment-success.html
└─ payment.html

assets/
├─ favicon.ico
└─ logo.svg

legal/
├─ privacy.html
└─ terms.html

public/
└─ .gitkeep

site/
├─ contact.html
├─ index.html
├─ pricing.html
├─ site.js
├─ support.html
└─ partials/
   ├─ footer.html
   └─ header.html

styles/
├─ app.css
└─ site.css

workers/
└─ api/
   ├─ src/
   │  ├─ .keep
   │  └─ index.js
   └─ wrangler.toml

README.md

_redirects

build.mjs


---

## Redeploy: Cloudflare Pages

Use this when you see **“Last build failed”** or Pages content is stale.

### Option A — Retry Failed Deployment (Preferred)

1. Cloudflare Dashboard  
2. **Workers & Pages → Pages**
3. Select the project (example: `taxmonitor-pro-site`)
4. Open **Deployments**
5. Locate the failed build
6. Click **Retry deployment**

### Option B — Trigger New Deployment via GitHub

Use this if no retry button is available.

1. Make a small change in the repo (example: update `README.md`)
2. Commit the change
3. Push to the connected branch (`main`)
4. Cloudflare Pages will auto-build and redeploy

---

## Redeploy: Cloudflare Workers

Use this if APIs, checkout, or background logic fails.

### Dashboard Deploy (Fastest)

1. Cloudflare Dashboard  
2. **Workers & Pages → Workers**
3. Select the Worker (example: `taxmonitor-api`)
4. Open **Deployments / Versions**
5. Click **Deploy** or **Promote latest version**

### Wrangler Deploy (Local)

Only use this if deploying intentionally from local.

```bash
wrangler deploy







