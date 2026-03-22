-- Migration: 0003_create_tmp_inquiries
-- Table: tmp_inquiries
-- Phase: 2
-- Projection of: /r2/inquiries/{inquiry_id}.json

CREATE TABLE IF NOT EXISTS tmp_inquiries (
  inquiry_id      TEXT NOT NULL PRIMARY KEY,
  account_id      TEXT,
  professional_id TEXT,
  email           TEXT NOT NULL,
  name            TEXT,
  status          TEXT NOT NULL DEFAULT 'open',
  source_page     TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_inquiries_account_id
  ON tmp_inquiries (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_inquiries_professional_id
  ON tmp_inquiries (professional_id);

CREATE INDEX IF NOT EXISTS idx_tmp_inquiries_status
  ON tmp_inquiries (status);
