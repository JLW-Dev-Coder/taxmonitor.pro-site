-- Migration: 0001_create_tmp_taxpayer_accounts
-- Table: tmp_taxpayer_accounts
-- Phase: 2
-- Projection of: /r2/taxpayer_accounts/{account_id}.json

CREATE TABLE IF NOT EXISTS tmp_taxpayer_accounts (
  account_id   TEXT NOT NULL PRIMARY KEY,
  email        TEXT NOT NULL,
  display_name TEXT,
  role         TEXT NOT NULL DEFAULT 'taxpayer',
  plan         TEXT,
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tmp_taxpayer_accounts_email
  ON tmp_taxpayer_accounts (email);

CREATE INDEX IF NOT EXISTS idx_tmp_taxpayer_accounts_role
  ON tmp_taxpayer_accounts (role);

CREATE INDEX IF NOT EXISTS idx_tmp_taxpayer_accounts_status
  ON tmp_taxpayer_accounts (status);
