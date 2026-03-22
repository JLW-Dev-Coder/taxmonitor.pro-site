-- Migration: 0010_create_tmp_poa_records
-- Table: tmp_poa_records
-- Phase: 13 (table created in Phase 2; handler wired in Phase 13)
-- POA Form 2848 records
-- caf_number stored in R2 ONLY (encrypted AES-256-GCM) — NEVER in D1, NEVER in API response

CREATE TABLE IF NOT EXISTS tmp_poa_records (
  poa_id          TEXT NOT NULL PRIMARY KEY,
  account_id      TEXT NOT NULL,
  professional_id TEXT,
  signature_type  TEXT NOT NULL,
  document_id     TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  signed_at       TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- caf_number is intentionally absent — stored encrypted in R2 only
-- R2 path: /r2/tmp_poa_records/{account_id}/{poa_id}.json

CREATE INDEX IF NOT EXISTS idx_tmp_poa_records_account_id
  ON tmp_poa_records (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_poa_records_professional_id
  ON tmp_poa_records (professional_id);

CREATE INDEX IF NOT EXISTS idx_tmp_poa_records_status
  ON tmp_poa_records (status);
