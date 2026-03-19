-- Migration: 0016_create_tmp_exit_surveys
-- Table: tmp_exit_surveys
-- Phase: 9 — CREATED now (Phase 2), APPLIED in Phase 9 [Q4]
-- Triggered on membership cancellation
-- Projection of: /r2/tmp_exit_surveys/{survey_id}.json

CREATE TABLE IF NOT EXISTS tmp_exit_surveys (
  survey_id    TEXT    NOT NULL PRIMARY KEY,
  account_id   TEXT    NOT NULL,
  reason       TEXT,
  feedback     TEXT,
  rating       INTEGER,
  submitted_at TEXT    NOT NULL,
  created_at   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_exit_surveys_account_id
  ON tmp_exit_surveys (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_exit_surveys_reason
  ON tmp_exit_surveys (reason);

CREATE INDEX IF NOT EXISTS idx_tmp_exit_surveys_submitted_at
  ON tmp_exit_surveys (submitted_at);
