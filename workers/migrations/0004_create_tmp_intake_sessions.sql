-- Migration: 0004_create_tmp_intake_sessions
-- Table: tmp_intake_sessions
-- Phase: 2
-- Projection of: /r2/tmp_intake_sessions/{session_id}.json

CREATE TABLE IF NOT EXISTS tmp_intake_sessions (
  session_id       TEXT NOT NULL PRIMARY KEY,
  account_id       TEXT,
  step             TEXT,
  completed_steps  TEXT,
  started_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_intake_sessions_account_id
  ON tmp_intake_sessions (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_intake_sessions_step
  ON tmp_intake_sessions (step);
