-- Migration: 0011_create_tmp_compliance_reports
-- Table: tmp_compliance_reports
-- Phase: 12 (table created in Phase 2; handler wired in Phase 12)
-- Report content stored encrypted in R2 — D1 stores metadata only
-- Depends on Phase 11 (document storage) before live use

CREATE TABLE IF NOT EXISTS tmp_compliance_reports (
  report_id          TEXT NOT NULL PRIMARY KEY,
  account_id         TEXT NOT NULL,
  professional_id    TEXT NOT NULL,
  engagement_id      TEXT,
  type               TEXT,
  status             TEXT NOT NULL DEFAULT 'draft',
  generated_at       TEXT,
  taxpayer_viewed_at TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_compliance_reports_account_id
  ON tmp_compliance_reports (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_compliance_reports_professional_id
  ON tmp_compliance_reports (professional_id);

CREATE INDEX IF NOT EXISTS idx_tmp_compliance_reports_engagement_id
  ON tmp_compliance_reports (engagement_id);

CREATE INDEX IF NOT EXISTS idx_tmp_compliance_reports_status
  ON tmp_compliance_reports (status);
