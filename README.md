# Tax Monitor Pro (TMP)

**Domain:** taxmonitor.pro
**Purpose:** Taxpayer-facing directory and membership platform

---

## 2. System Overview

### What this repo is

The frontend for Tax Monitor Pro — a Next.js static site that connects taxpayers with tax professionals. Taxpayers browse the directory, select a professional, and complete an intake-to-payment workflow. Tax professionals get listed and serve clients through a structured engagement pipeline.

### What this repo is NOT

- Not a backend — no Worker routes, no API handlers, no database access
- Not a CMS — content is either static or fetched from the VLP API
- Not a batch generation system — no cron jobs, no scheduled tasks

### Where it fits in the system

TMP is the consumer-facing frontend. All backend logic, auth, billing, contracts, and data storage are handled by the VLP Worker at `api.virtuallaunch.pro`. TMP calls the VLP API exclusively through `lib/api.ts`.

---

## 3. Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.1.7 |
| Styling | CSS Modules (no Tailwind, no inline styles) |
| Build output | Static export (`out/`) |
| Hosting | Cloudflare Pages |
| API client | `lib/api.ts` → `api.virtuallaunch.pro` |
| Auth | `vlp_session` HttpOnly cookie (managed by VLP Worker) |

---

## 4. Responsibilities

| Responsibility | Owner |
|----------------|-------|
| Frontend pages and UI | This repo (TMP) |
| Directory listing and profile display | This repo (TMP) |
| Intake flow UI (inquiry → payment) | This repo (TMP) |
| API routing, auth, billing | VLP Worker |
| Contract validation | VLP Worker |
| R2/D1 storage | VLP Worker |
| Stripe checkout | VLP Worker |
| Cal.com booking | VLP Worker |

---

## 5. Repo Structure

```
taxmonitor.pro/
├── .claude/               [config]   Claude context + canonicals
├── app/                   [source]   Next.js App Router pages
│   ├── contracts/         [legacy]   Legacy contract JSON files
│   ├── pages/             [legacy]   Legacy HTML app pages
│   └── partials/          [legacy]   Legacy HTML partials
├── assets/                [legacy]   Legacy static assets
├── components/            [source]   Shared React components
├── contracts/             [legacy]   47 contract JSON files (pending VLP migration)
├── directory/             [legacy]   Legacy directory HTML + sample profiles
├── legal/                 [legacy]   Legacy legal HTML pages
├── lib/                   [source]   API client + shared utilities
├── public/                [source]   Static assets for Next.js
├── site/                  [legacy]   Legacy site HTML pages
├── styles/                [legacy]   Legacy CSS files
├── tools/                 [legacy]   Legacy HTML tool pages
├── out/                   [generated] Static export output
└── node_modules/          [generated] npm dependencies
```

---

## 6. Core Workflows

<!-- Phase 1+ -->

---

## 7. Data Contracts

Contracts are defined in the VLP repo at `contracts/registries/tmp-registry.json`. 47 contract JSON files exist locally in `contracts/` — these are pending migration to the VLP repo and should not be treated as authoritative.

---

## 8. Setup

```bash
npm install
npm run dev
```

---

## 9. Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build static export |
| `npm run pages:build` | Build for Cloudflare Pages |
| `npm run deploy` | Build and deploy to Cloudflare Pages |

---

## 10. Environment

No environment variables in this repo. All configuration lives in the VLP Worker `wrangler.toml`.

---

## 11. Deployment

- **Platform:** Cloudflare Pages
- **Build command:** `npm run build`
- **Output directory:** `out/`
- **Export mode:** Static export (no SSR)

---

## 12. Constraints

- No backend routes — all backend logic lives in VLP Worker
- No contracts defined here — contracts belong in VLP repo
- Auth uses `vlp_session` HttpOnly cookie managed by VLP Worker
- Do not delete legacy HTML until corresponding .tsx achieves full feature parity
- All API calls must target `api.virtuallaunch.pro` — never `api.taxmonitor.pro`
- CSS Modules only — no Tailwind, no inline styles
- All fetch() calls via `lib/api.ts` only

---

## 13. Related Systems

| System | Domain | Role |
|--------|--------|------|
| VLP | virtuallaunch.pro | Worker + contracts + shared infrastructure |
| TTMP | transcript.taxmonitor.pro | IRS transcript parsing |
| TTTMP | taxtools.taxmonitor.pro | Tax education + form tools |

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| `vlp_session` | Auth cookie — HttpOnly, managed by VLP Worker |
| VLP Worker | Single backend Worker serving all 8 platforms in the VLP ecosystem |
| TMP | Tax Monitor Pro — this repo's product |
| TTMP | Transcript Tax Monitor Pro — IRS transcript parsing tool |
| TTTMP | Tax Tools Tax Monitor Pro — tax education and form tools |

---

## License

Proprietary — Virtual Launch Pro / Tax Monitor Pro.
Unauthorized redistribution or modification is prohibited.
