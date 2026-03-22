-- Migration: 0005_create_tmp_activity
-- Table: tmp_activity
-- Phase: 2
-- Append-only audit trail — never update or delete rows

CREATE TABLE IF NOT EXISTS tmp_activity (
  activity_id   TEXT NOT NULL PRIMARY KEY,
  account_id    TEXT,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  actor_id      TEXT,
  ip_address    TEXT,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_activity_account_id
  ON tmp_activity (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_activity_action
  ON tmp_activity (action);

CREATE INDEX IF NOT EXISTS idx_tmp_activity_created_at
  ON tmp_activity (created_at);
