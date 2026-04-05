# taxmonitor.pro — Claude Context

## 1. Header

- **Repo:** taxmonitor.pro
- **Product:** Tax Monitor Pro (TMP)
- **Domain:** taxmonitor.pro
- **Last updated:** 2026-04-04
- **Purpose:** Taxpayer-facing directory and membership platform — frontend only

---

## 2. System Definition

**What it is:**
Taxpayer-facing directory and membership platform. Taxpayers find tax professionals, professionals get listed and serve clients through the intake-to-completion workflow.

**What it is NOT:**
Not a backend. Not a CMS. Not a batch generation system. No Worker routes live here.

**Audience:**
Individual taxpayers seeking tax professional representation, and tax professionals seeking client leads.

**Stack:**
Next.js 15.1.7, CSS Modules, static export, Cloudflare Pages

**Backend:**
api.virtuallaunch.pro (VLP Worker) — all API calls via `lib/api.ts`

---

## 3. Hard Constraints

- No backend routes in this repo — all backend logic lives in VLP Worker
- No contracts defined in this repo — contracts belong in VLP repo under `contracts/registries/tmp-registry.json`
- Auth uses `vlp_session` HttpOnly cookie managed by VLP Worker
- Do not delete legacy HTML until corresponding .tsx achieves full feature parity
- All API calls must target `api.virtuallaunch.pro` — never `api.taxmonitor.pro`
- CSS Modules only — no Tailwind, no inline styles
- All fetch() calls via `lib/api.ts` only

---

## 4. Terminology (Canonical Language Layer)

| Do NOT use | Use instead |
|------------|-------------|
| api.taxmonitor.pro | api.virtuallaunch.pro |
| tmp_session | vlp_session |
| TMP Worker | VLP Worker |

---

## 5. Repo Structure

```
taxmonitor.pro/
├── .claude/               [config]   Claude context + canonicals
│   └── canonicals/        [config]   Structural templates for docs
├── app/                   [source]   Next.js App Router pages (.tsx)
│   ├── about/
│   ├── agreement/
│   ├── calendar/
│   ├── contact/
│   ├── contracts/         [legacy]   Legacy contract JSON files
│   ├── dashboard/
│   │   └── profile/
│   ├── directory/
│   │   └── profile/
│   ├── features/
│   ├── inquiry/
│   ├── intake/
│   ├── legal/
│   │   ├── privacy/
│   │   ├── refund/
│   │   └── terms/
│   ├── messages/
│   ├── offer/
│   ├── office/
│   ├── pages/             [legacy]   Legacy HTML app pages
│   │   ├── account/
│   │   ├── flows/
│   │   ├── staff/
│   │   └── tax-pro/
│   ├── partials/          [legacy]   Legacy HTML partials
│   ├── payment/
│   ├── payment-success/
│   ├── pricing/
│   ├── report/
│   ├── sign-in/
│   ├── status/
│   └── support/
├── assets/                [legacy]   Legacy static assets
│   ├── directory/         [legacy]   Sample profile images
│   └── images/            [legacy]   Legacy images
├── components/            [source]   Shared React components
├── contracts/             [legacy]   47 contract JSON files (pending VLP migration)
├── directory/             [legacy]   Legacy directory HTML + sample profiles
├── legal/                 [legacy]   Legacy legal HTML pages
├── lib/                   [source]   API client + shared utilities
├── public/                [source]   Static assets for Next.js
├── site/                  [legacy]   Legacy site HTML pages
│   ├── partials/
│   └── resources/
├── styles/                [legacy]   Legacy CSS files
├── tools/                 [legacy]   Legacy HTML tool pages
├── out/                   [generated] Next.js static export output
├── node_modules/          [generated] npm dependencies
├── next.config.ts         [config]   Next.js configuration
├── package.json           [config]   Project manifest
└── tsconfig.json          [config]   TypeScript configuration
```

---

## 6. Data Contracts

- **Source of truth:** VLP Worker R2 storage
- **Contract definitions:** VLP repo `contracts/registries/tmp-registry.json`
- **Note:** 47 contract files exist locally in `contracts/` — these are pending migration to VLP repo and should not be treated as authoritative

---

## 7. Execution Logic

<!-- Phase 1+ -->

---

## 8. External Interfaces

- **API:** `api.virtuallaunch.pro` (all routes)
- **Storage:** R2 via VLP Worker (authoritative), D1 via VLP Worker (projection)
- **Auth:** `vlp_session` cookie
- **Billing:** Stripe via VLP Worker
- **Booking:** Cal.com via VLP Worker

---

## 9. Personalization / Business Logic

<!-- Phase 4 — VLP SCALE -->

---

## 10. Routing / URL Rules

- `/directory` — public tax professional directory
- `/directory/profile?id={professional_id}` — individual profile page
- `/app/*` — authenticated dashboard pages
- `/legal/*` — legal pages (privacy, terms, refund)
- `/sign-in` — magic link + Google OAuth authentication
- Intake flow: `/inquiry` → `/intake` → `/offer` → `/agreement` → `/payment` → `/payment-success`

---

## 11. Lifecycle / Scheduling

<!-- Phase 4 — VLP SCALE -->

---

## 12. Operational Loop

<!-- Phase 4 — VLP SCALE -->

---

## 13. Metrics / Business Context

### VLP Membership Tiers (tax professional, B2B)

| Tier | Price | Transcript tokens/mo | Game tokens/mo |
|------|-------|----------------------|----------------|
| Listed | $0 | 0 | 0 |
| Active | $79/mo | 2 | 5 |
| Featured | $199/mo | 5 | 15 |
| Premier | $399/mo | 10 | 40 |

### TMP Membership Tiers (taxpayer, B2C)

| Tier | Price | Tokens/mo |
|------|-------|-----------|
| Free | $0 | 0 |
| Essential | $9/mo or $99/yr | 5 tool + 2 transcript |
| Plus | $19/mo or $199/yr | 15 tool + 5 transcript |
| Premier | $39/mo or $399/yr | 40 tool + 10 transcript |

---

## 14. Reference Docs Priority

1. `.claude/CLAUDE.md` (this file) — authoritative for TMP repo
2. VLP `.claude/CLAUDE.md` — authoritative for backend, contracts, write pipeline
3. `MARKET.md` — product positioning
4. `SCALE.md` — campaign logic (when created)
5. `.claude/canonicals/*` — structural templates for all docs

---

## 15. Hard Constraints (Repeat)

- No backend routes in this repo — all backend logic lives in VLP Worker
- No contracts defined in this repo — contracts belong in VLP repo under `contracts/registries/tmp-registry.json`
- Auth uses `vlp_session` HttpOnly cookie managed by VLP Worker
- Do not delete legacy HTML until corresponding .tsx achieves full feature parity
- All API calls must target `api.virtuallaunch.pro` — never `api.taxmonitor.pro`
- CSS Modules only — no Tailwind, no inline styles
- All fetch() calls via `lib/api.ts` only

---

## 16. Related Systems / Repos

| Repo | Local Path | Role |
|------|-----------|------|
| VLP | `C:\Users\eimaj\virtuallaunch.pro` | Worker + contracts + shared infra |
| TTMP | `C:\Users\eimaj\transcript.taxmonitor.pro` | IRS transcript parsing |
| TTTMP | `C:\Users\eimaj\taxtools.taxmonitor.pro` | Tax education + form tools |

---

## 17. Phase Tracker

| Phase | Name | Status | Completed |
|-------|------|--------|-----------|
| 0 | TMP repo cleanup | complete | 2026-04-04 |
| 1 | TMP directory filters + sample profiles | complete | 2026-04-04 |
| 2 | VLP membership tiers in Stripe | not started | — |
| 3 | VLP pricing + signup pages | not started | — |
| 4 | VLP SCALE asset pages + email copy | not started | — |
| 5 | Test full workflow end to end | not started | — |
| 6 | Intake + service pool | not started | — |

Update this table as each phase completes.

---

## 18. Legacy HTML Policy

Legacy `.html` files are retained as working reference throughout the repo.
Do not delete any legacy HTML file until the corresponding `.tsx` page has been
verified to match all functionality, including:
- Layout and styling
- Data loading (API calls or static data)
- Filter/search capabilities
- Navigation and linking
- Mobile responsiveness

Legacy files include but are not limited to:
- app/*.html (agreement, inquiry, intake, offer, payment, login, payment-success)
- directory/sample-*/index.html + data.json
- directory/index.html, profile-builder.html, profile-template.html
- site/, tools/, styles/, assets/, legal/

When a .tsx replacement achieves full parity, delete the .html version and
remove it from this list.

---

## Post-Task Requirements

After completing any task:
1. Stage all changes: git add -A
2. Commit with a descriptive message: git commit -m "[Phase X] description of changes"
3. Report the commit hash in the task report

Never leave uncommitted changes. Every task ends with a clean working tree.
