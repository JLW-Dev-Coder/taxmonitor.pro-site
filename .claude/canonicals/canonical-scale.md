# canonical-scale.md

# 1. Header (Identity)
- System name
- Product being sold
- Last updated
- One-line objective

# 2. Objective
- What SCALE does — one paragraph
- Revenue target or breakeven math
- Timeline constraints

# 3. Tech Stack
| Tool | Plan | Cost | Purpose |
- Only tools actively used
- Total monthly cost

# 4. Pipeline
| Step | Owner | Action | Output |
- End-to-end from prospect sourcing to closed sale
- Clear ownership at each step

# 5. Prospect Sourcing
- Where leads come from
- CSV schema (canonical columns)
- Tracking columns (append-only)
- Selection logic (filters, sort, limits)

# 6. Email Sequences
## Email 1 — Structure
- Subject line pattern
- Body structure (pain → tool → CTA)
- Signature
## Email 2 — Structure
- Timing relative to Email 1
- Subject line pattern
- Body structure
- CTAs
## Email 3+ (if defined)

# 7. Asset Pages
- URL pattern
- Data schema (what the page shows)
- CTAs on the page
- R2 storage key pattern

# 8. Personalization Rules
- By credential type
- By firm bucket
- By geography
- Slug generation rules

# 9. Output Files
## Batch JSON
- Path, schema, per-prospect structure
## Gmail CSV
- Path, columns, RFC-4180 rules
## Updated Source CSV
- What gets stamped after each batch

# 10. Delivery Pipeline
- Who sends (Worker cron, manual, etc.)
- R2 push commands
- Timing and sequencing

# 11. Analytics
- What is tracked at each stage
- Email metrics, page metrics, booking metrics, sales metrics

# 12. Tone Rules
- Specific to outreach copy
- What to avoid

# 13. Growth Plan
- Phase 1: establish the loop
- Phase 2: scale and prove
- Phase 3: compound

# 14. Non-Goals
- What SCALE explicitly does not do
