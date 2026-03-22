-- Migration: 0009_create_tmp_documents
-- Table: tmp_documents
-- Phase: 2
-- Document metadata only — NO content stored in D1
-- Content stored encrypted at /r2/tmp_documents/{account_id}/{document_id}.enc [Q6]

CREATE TABLE IF NOT EXISTS tmp_documents (
  document_id TEXT    NOT NULL PRIMARY KEY,
  account_id  TEXT    NOT NULL,
  filename    TEXT,
  mime_type   TEXT,
  size_bytes  INTEGER,
  r2_key      TEXT    NOT NULL,
  encrypted   INTEGER NOT NULL DEFAULT 1,
  uploaded_at TEXT    NOT NULL,
  created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tmp_documents_account_id
  ON tmp_documents (account_id);
