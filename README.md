# Tax Monitor Pro

Production repo for the Tax Monitor Pro site, app UI, and Cloudflare Worker API.

This README documents:
- Architecture (authoritative model)
- Repo structure (production)
- Redeploy procedures (Pages + Worker)

---

## Architecture

Tax Monitor Pro runs on:

Alphabetical:
- Cal.com
- ClickUp
- Cloudflare Pages
- Cloudflare Workers
- R2
- Stripe

Authority model:
- Pages = UI
- Worker = logic
- R2 = authority
- ClickUp = execution

Event triggers:
- Cal.com → Worker → R2 → ClickUp
- Stripe → Worker → R2 → ClickUp

---

## Repo Structure

app/ ├─ agreement.html ├─ index.html ├─ intake.html ├─ login.html ├─ offer.html ├─ payment-success.html ├─ payment.html └─ pages/ ├─ calendar.html ├─ files.html ├─ messaging.html ├─ office.html ├─ projects.html ├─ start-here.html ├─ support.html └─ flows/ ├─ intake/ │ ├─ agreement.html │ ├─ intake.html │ ├─ offer.html │ └─ payment.html └─ post-payment/ ├─ address-update.html ├─ client-exit-survey.html ├─ compliance-report.html ├─ esign-2848.html ├─ filing-status.html └─ welcome.html assets/ ├─ favicon.ico └─ logo.svg legal/ ├─ privacy.html └─ terms.html public/ └─ .gitkeep site/ ├─ contact.html ├─ index.html ├─ pricing.html ├─ site.js ├─ support.html └─ partials/ ├─ footer.html └─ header.html styles/ ├─ app.css └─ site.css workers/ └─ api/ ├─ src/ │ └─ index.js └─ wrangler.toml README.md _redirects

---

## Redeploy: Cloudflare Pages

Use this when you see "Last build failed" or Pages content is stale.

Option A — Retry failed deployment
1. Cloudflare Dashboard
2. Workers & Pages → Pages
3. Select the Pages project
4. Deployments
5. Open the failed build
6. Retry deployment

Option B — Trigger a new deployment via GitHub
1. Commit a small change (example: README.md)
2. Push to main
3. Pages auto-builds and deploys

---

## Redeploy: Cloudflare Worker (API)

The API is a single Worker entrypoint:
- workers/api/src/index.js

Option A — Dashboard deploy
1. Cloudflare Dashboard
2. Workers & Pages → Workers
3. Select the Worker (match wrangler.toml name)
4. Deployments / Versions
5. Deploy or Promote latest version

Option B — Wrangler deploy (local)

```bash
wrangler deploy

