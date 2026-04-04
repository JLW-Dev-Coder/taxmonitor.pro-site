# SCALE.md

VLP SCALE for TMP — Outreach & Acquisition System

---

## 1. Header (Identity)

- **System:** VLP SCALE for TMP
- **Product being sold:** VLP membership tiers (Active $79/mo, Featured $199/mo, Premier $399/mo) with TTMP token packs ($19/$29/$129) as low-friction entry
- **Last updated:** 2026-04-04
- **Objective:** Acquire tax professional members through cold email outreach to FOIA/NAEA prospect list

---

## 2. Objective

VLP SCALE generates personalized outreach packages — emails, asset pages, and tracking metadata — to convert tax professionals from FOIA/NAEA prospect lists into paying VLP members. TTMP token packs serve as a low-friction entry point; VLP membership tiers are the revenue target.

**Breakeven:** 2 Active members at $79/mo covers ~$100/mo Claude cost.

**Timeline:** Phase 4 in TMP roadmap.

---

## 3. Tech Stack

| Tool | Plan | Cost | Purpose |
|------|------|------|---------|
| Claude | Max | ~$100/mo | Batch generation (emails, asset pages, personalization) |
| Gmail | Workspace | included | Outbound email delivery via VLP Worker |
| Cal.com | Pro | included | Booking links for prospect calls |
| Stripe | Standard | usage | Payment processing for memberships |

**Total monthly cost:** ~$100/mo (Claude Max)

---

## 4. Pipeline

| Step | Owner | Action | Output |
|------|-------|--------|--------|
| 1. Source | Operator | Pull FOIA/NAEA CSV, filter, dedupe | Cleaned prospect CSV |
| 2. Filter | Operator | Exclude existing TTMP pipeline prospects | Filtered CSV |
| 3. Generate | Claude Skill | Run batch generator per prospect | Batch JSON + Gmail CSV |
| 4. Review | Operator | Spot-check emails and asset pages | Approved batch |
| 5. Upload | VLP Worker | Push asset pages to R2 | Live asset URLs |
| 6. Send | Operator/Worker | Send via Gmail | Delivered emails |
| 7. Track | VLP Worker | Log opens, clicks, bookings | Analytics |

---

## 5. Prospect Sourcing

<!-- Phase 4 — VLP SCALE -->

---

## 6. Email Sequences

<!-- Phase 4 — VLP SCALE -->

---

## 7. Asset Pages

<!-- Phase 4 — VLP SCALE -->

---

## 8. Personalization Rules

<!-- Phase 4 — VLP SCALE -->

---

## 9. Output Files

<!-- Phase 4 — VLP SCALE -->

---

## 10. Delivery Pipeline

<!-- Phase 4 — VLP SCALE -->

---

## 11. Analytics

<!-- Phase 4 — VLP SCALE -->

---

## 12. Tone Rules

<!-- Phase 4 — VLP SCALE -->

---

## 13. Growth Plan

<!-- Phase 4 — VLP SCALE -->

---

## 14. Non-Goals

<!-- Phase 4 — VLP SCALE -->
