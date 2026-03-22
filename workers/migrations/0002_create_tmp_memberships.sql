-- Migration: 0002_create_tmp_memberships
-- Table: tmp_memberships
-- Phase: 2
-- Projection of: /r2/taxpayer_memberships/{membership_id}.json

CREATE TABLE IF NOT EXISTS tmp_memberships (
  membership_id              TEXT NOT NULL PRIMARY KEY,
  account_id                 TEXT NOT NULL,
  plan                       TEXT NOT NULL,
  billing_period             TEXT,
  status                     TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id         TEXT,
  stripe_checkout_session_id TEXT,
  created_at                 TEXT NOT NULL,
  updated_at                 TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_memberships_account_id
  ON tmp_memberships (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_memberships_status
  ON tmp_memberships (status);

CREATE INDEX IF NOT EXISTS idx_tmp_memberships_plan
  ON tmp_memberships (plan);
