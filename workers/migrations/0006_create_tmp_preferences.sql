-- Migration: 0006_create_tmp_preferences
-- Table: tmp_preferences
-- Phase: 2
-- Notification preferences per account

CREATE TABLE IF NOT EXISTS tmp_preferences (
  account_id TEXT NOT NULL PRIMARY KEY,
  in_app     INTEGER NOT NULL DEFAULT 1,
  sms        INTEGER NOT NULL DEFAULT 0,
  email      INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
