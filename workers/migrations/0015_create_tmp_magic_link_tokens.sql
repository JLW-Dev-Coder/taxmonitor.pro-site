-- Migration: 0015_create_tmp_magic_link_tokens
-- Table: tmp_magic_link_tokens
-- Phase: 2/3 (table created in Phase 2; handler wired in Phase 3)
-- Tokens stored as SHA-256 hash (not reversible)
-- Raw token delivered via email only — NEVER stored in cleartext
-- used = 1 after verification — rows never deleted (audit trail)
-- TTL: MAGIC_LINK_EXPIRATION_MINUTES = 15 min (enforced by expires_at check, not by deletion)

CREATE TABLE IF NOT EXISTS tmp_magic_link_tokens (
  token_hash TEXT    NOT NULL PRIMARY KEY,
  account_id TEXT,
  email      TEXT    NOT NULL,
  expires_at TEXT    NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_magic_link_tokens_email
  ON tmp_magic_link_tokens (email);

CREATE INDEX IF NOT EXISTS idx_tmp_magic_link_tokens_expires_at
  ON tmp_magic_link_tokens (expires_at);
