# taxmonitor.pro — Claude Context

## Role of This Repo
FRONTEND ONLY after migration. No backend logic.
All API calls go to https://api.virtuallaunch.pro

## Critical Rule — Preserve Page Layouts
When converting HTML → TSX:
PRESERVE: Layout structure, sections, content flow,
          visual hierarchy, spacing intent
REPLACE:  Inline styles → CSS Module classes
          Hardcoded colors → var() tokens
          <script> API calls → lib/api.ts
          Static partials → shared components
ADD:      TypeScript types, loading/error states,
          mobile responsiveness if missing
NEVER:    Redesign pages, reorder sections,
          remove content, change visual feel

## Platform Overview
Tax Monitor Pro — taxpayer-facing monitoring platform.
Two plan structures:
Plan I: Free / Essential ($9) / Plus ($19) / Premier ($39)
Plan II: Bronze ($275-6wk) / Silver ($325-8wk) /
         Gold ($425-12wk) / Snapshot ($425) / MFJ (+$79)

## Migration Status
Phase 1: ✅ .claude setup + accent color proposal
Phase 2: ✅ Next.js scaffold complete (2026-03-29)
Phase 3: ✅ Site pages + intake pipeline complete (2026-03-29)
Phase 4: ✅ App pages (authenticated dashboard) (2026-03-30)
Phase 5: ❌ Delete legacy Worker
Phase 6: ❌ Delete D1 database

## Hard Rules
- Never create a new Worker in this repo
- Never add backend logic
- Delete web/ directory (Tailwind — wrong standard)
- All fetch() calls via lib/api.ts only
- CSS Modules only — no Tailwind, no inline styles
- workers/ directory scheduled for deletion

## VLP API Base URL
https://api.virtuallaunch.pro

## Route Mapping (Legacy → VLP)
/v1/auth/magic-link/request → /v1/auth/magic-link/request
/v1/auth/magic-link/verify  → /v1/auth/magic-link/verify
/v1/auth/session            → /v1/auth/session
/v1/auth/logout             → /v1/auth/logout
/v1/auth/google/start       → /v1/auth/google/start
/v1/auth/google/callback    → /v1/auth/google/callback
/v1/checkout/sessions       → /v1/checkout/sessions
/v1/checkout/status         → /v1/checkout/status
/v1/directory/professionals → /v1/tmp/directory
/v1/inquiries               → /v1/tmp/inquiries
/v1/taxpayer-memberships/*  → /v1/tmp/memberships/*
/v1/taxpayer-accounts/*     → /v1/accounts/*
/v1/support/tickets/*       → /v1/support/tickets/*
/v1/pricing                 → /v1/tmp/pricing
/v1/directory/profile/:id   → /v1/profiles/public/:id
/v1/tmp/directory           → /v1/tmp/directory (city/state/zip filtering supported)
/v1/notifications/*         → /v1/notifications/*

## Frontend Architecture
lib/api.ts       — central API client, all fetch() calls
lib/plans.ts     — Plan I + Plan II pricing data
components/      — Header, Footer, shared UI
app/             — Next.js App Router pages
public/          — static assets

## Converted Pages (Phase 3)
Site: / (home), /about, /contact, /features, /pricing
Auth: /sign-in (magic link + Google OAuth)
Directory: /directory, /directory/profile?id=<slug>
Intake flow: /inquiry → /intake → /offer →
  /agreement → /payment → /payment-success
Legal: /legal/privacy, /legal/refund, /legal/terms

## sessionStorage Data Flow (Intake Pipeline)
inquiry_data → intake_data → offer_data →
  agreement_data → cleared on payment-success

## Directory Profile Routing
Uses /directory/profile?id=<slug> (static export
  constraint). Cloudflare Pages _redirects can map
  /directory/<slug> to clean URLs.

## Pages Still To Convert (Phase 4)
App pages: app/pages/account/profile.html,
  app/pages/calendar.html, app/pages/messaging.html,
  app/pages/office.html, app/pages/report.html,
  app/pages/status.html, app/pages/support.html,
  app/pages/tax-pro/dashboard.html
