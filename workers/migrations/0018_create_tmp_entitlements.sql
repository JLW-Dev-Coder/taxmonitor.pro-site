-- Migration 0018: Create tmp_entitlements table
-- Platform: Tax Monitor Pro (TMP)
-- Phase: 9 (Billing + Monitoring Engagement Checkout)
-- Table: tmp_entitlements
-- Description: Token balance and plan entitlements per taxpayer account.
--              R2 canonical path: tmp_entitlements/{account_id}.json
--              R2 is always authoritative. This table is a D1 projection only.
--              Written by: PATCH /v1/entitlements/{account_id},
--                          POST /v1/webhooks/stripe (on membership activation)

CREATE TABLE IF NOT EXISTS tmp_entitlements (
  account_id           TEXT NOT NULL PRIMARY KEY,
  plan                 TEXT NOT NULL DEFAULT 'free',
  tax_tool_tokens      INTEGER NOT NULL DEFAULT 0,
  transcript_tokens    INTEGER NOT NULL DEFAULT 0,
  tokens_granted_at    TEXT,
  billing_period_end   TEXT,
  updated_at           TEXT NOT NULL
);
