-- Migration: 0012_create_tmp_support_tickets
-- Table: tmp_support_tickets
-- Phase: 2
-- Projection of: /r2/support_tickets/{ticket_id}.json

CREATE TABLE IF NOT EXISTS tmp_support_tickets (
  ticket_id  TEXT NOT NULL PRIMARY KEY,
  account_id TEXT NOT NULL,
  subject    TEXT,
  status     TEXT NOT NULL DEFAULT 'open',
  priority   TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_support_tickets_account_id
  ON tmp_support_tickets (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_support_tickets_status
  ON tmp_support_tickets (status);

CREATE INDEX IF NOT EXISTS idx_tmp_support_tickets_priority
  ON tmp_support_tickets (priority);
