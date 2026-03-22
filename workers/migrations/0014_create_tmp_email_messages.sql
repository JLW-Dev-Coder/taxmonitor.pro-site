-- Migration: 0014_create_tmp_email_messages
-- Table: tmp_email_messages
-- Phase: 2
-- Projection of: /r2/email_messages/{message_id}.json

CREATE TABLE IF NOT EXISTS tmp_email_messages (
  message_id TEXT NOT NULL PRIMARY KEY,
  account_id TEXT NOT NULL,
  subject    TEXT,
  direction  TEXT NOT NULL DEFAULT 'outbound',
  status     TEXT NOT NULL DEFAULT 'sent',
  sent_at    TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_email_messages_account_id
  ON tmp_email_messages (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_email_messages_status
  ON tmp_email_messages (status);
