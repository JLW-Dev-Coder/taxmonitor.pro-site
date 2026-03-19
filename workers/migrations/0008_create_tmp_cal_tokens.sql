-- Migration: 0008_create_tmp_cal_tokens
-- Table: tmp_cal_tokens
-- Phase: 2
-- Cal.com OAuth tokens — AES-256-GCM encrypted at rest (Phase 5 wires OAuth flows)
-- Composite PK: one row per (account_id, app_type)

CREATE TABLE IF NOT EXISTS tmp_cal_tokens (
  account_id        TEXT NOT NULL,
  app_type          TEXT NOT NULL,
  token_ciphertext  TEXT NOT NULL,
  token_iv          TEXT NOT NULL,
  expires_at        TEXT,
  updated_at        TEXT NOT NULL,
  PRIMARY KEY (account_id, app_type)
);

CREATE INDEX IF NOT EXISTS idx_tmp_cal_tokens_account_id
  ON tmp_cal_tokens (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_cal_tokens_app_type
  ON tmp_cal_tokens (app_type);
