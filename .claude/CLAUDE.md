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
- All API calls must target `api.virtuallaunch.pro`
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
- `/inquiry` — multi-step guided decision tree for taxpayers. Step 0
  presents three paths: (a) "Find a Tax Professional" (matching flow),
  (b) "Start a Membership" (TMP Plan I/II, TTMP, TTTMP cards), and
  (c) "Not Sure" (3-question recommendation engine). The matching flow
  walks State → Service (18-item enum) → Entity (8-item enum) →
  Language (13-item enum, optional) and calls
  `GET /v1/profiles?state=X&service=Y&client_type=Z&language=W&match=true&limit=3`
  via `api.searchProfiles()` in `lib/api.ts`. Up to 3 pro cards render
  with credential badges, location, services, and rating; each has
  "View Profile" linking to `/directory/profile?id={slug}` and an
  inline "Contact" form that submits `POST /v1/tmp/inquiries` via
  `api.createInquiry()`. If 0 matches returned or the API fails, a
  fallback card links to `/contact`. Every step has a Back button and
  the progress indicator shows `Step N of M`. The page is a single
  client component with local step state.
- Intake flow: `/inquiry` → `/intake` → `/offer` → `/agreement` → `/payment` → `/payment-success`
- `/report` — authenticated compliance dashboard (tabbed staff/pro view)
- `/report/view?orderId={order_id}` — client-facing read-only compliance report
  (reads `tmp.compliance-record.read.v1` from
  `GET /v1/tmp/compliance-records/{orderId}/report`). Uses a query param
  because `output: 'export'` disallows runtime dynamic routes.
- `/forms/2848?caseId={case_id}` — client-facing Form 2848 eSign page.
  Taxpayer fills out and signs their Power of Attorney during the "eSign 2848"
  step of the compliance workflow. Submits to
  `POST /v1/tools/2848/generate` and downloads the returned PDF
  (`pdf_base64` + `filename`). Representative fields (name, CAF, PTIN, phone,
  designation, address) are pre-filled from the assigned pro's profile and
  read-only — currently a placeholder, TODO wire to `/v1/tmp/cases/{caseId}`.
  Uses a query param (not a dynamic route) because `output: 'export'`
  disallows runtime dynamic routes. Auth flow TBD — if the Worker returns
  401, the page prompts the taxpayer to sign in. May need magic link or
  case-specific token for unauthenticated taxpayers.

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
- All API calls must target `api.virtuallaunch.pro`
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

## Canonicals Enforcement (mandatory on every task)

Before writing any file, check whether the file type has a canonical template.
Canonical templates live in `.claude/canonicals/` in the **VLP repo** (`virtuallaunch.pro`)
and define the required structure for each file type across all 8 repos.

| File type | Canonical template | Check before... |
|-----------|-------------------|-----------------|
| CLAUDE.md | canonical-claude.md | Editing any CLAUDE.md |
| Contract JSON | canonical-contract.json | Creating or modifying any contract |
| Contract registry | canonical-contract-registry.json | Adding registry entries |
| index.html (landing) | canonical-index.html | Creating landing pages |
| MARKET.md | canonical-market.md | Editing marketing copy |
| README.md | canonical-readme.md | Editing any README |
| ROLES.md | canonical-roles.md | Editing role definitions |
| SCALE.md | canonical-scale.md | Editing pipeline docs |
| SKILL.md | canonical-skill.md | Editing skill files |
| STYLE.md | canonical-style.md | Editing style guides |
| Workflow docs | canonical-workflow.md | Editing workflow docs |
| wrangler.toml | canonical-wrangler.toml | Editing Worker config |

### Rules
1. If a canonical exists for the file type, read it BEFORE making changes
2. The output must contain every required section listed in the canonical
3. If the canonical defines required keys (e.g., `usedOnPages` in contracts),
   those keys must be present — never omit them
4. If a task would create a new file type not covered by a canonical,
   stop and report to Principal Engineer before proceeding
5. After completing the task, verify the output against the canonical checklist

### Cross-repo canonical source of truth
Canonical templates live in the VLP repo only (`virtuallaunch.pro/.claude/canonicals/`).
This repo does not maintain local copies. The Principal Engineer is responsible
for ensuring compliance.

---

## Post-Task Requirements

After completing any task:
1. Stage all changes: git add -A
2. Commit with a descriptive message: git commit -m "[Phase X] description of changes"
3. Report the commit hash in the task report

Never leave uncommitted changes. Every task ends with a clean working tree.

---

## Post-Task Rules (mandatory after every task)

1. **Commit:** After completing any task, commit all changed files with a descriptive message. Never leave work uncommitted.
2. **Push:** After committing, run `git push origin main`.
3. **Deploy:** Push triggers Cloudflare Pages automatically for TMP. No manual deploy needed.
4. **Report:** After commit+push, report the commit hash and any errors.
