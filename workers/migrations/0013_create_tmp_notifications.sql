-- Migration: 0013_create_tmp_notifications
-- Table: tmp_notifications
-- Phase: 2
-- Projection of: /r2/notifications_in_app/{notification_id}.json

CREATE TABLE IF NOT EXISTS tmp_notifications (
  notification_id TEXT    NOT NULL PRIMARY KEY,
  account_id      TEXT    NOT NULL,
  title           TEXT,
  body            TEXT,
  read            INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_notifications_account_id
  ON tmp_notifications (account_id);

-- Composite index supports read-status queries for a given account
CREATE INDEX IF NOT EXISTS idx_tmp_notifications_account_read
  ON tmp_notifications (account_id, read);

CREATE INDEX IF NOT EXISTS idx_tmp_notifications_created_at
  ON tmp_notifications (created_at);
