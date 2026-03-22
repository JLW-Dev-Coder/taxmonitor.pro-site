-- Migration: 0007_create_vlp_professionals_cache
-- Table: vlp_professionals_cache
-- Phase: 2
-- Read-only VLP professional directory cache.
-- TMP never writes to VLP R2. Populated via POST /v1/webhooks/vlp-directory (Phase 4).

CREATE TABLE IF NOT EXISTS vlp_professionals_cache (
  professional_id TEXT NOT NULL PRIMARY KEY,
  display_name    TEXT,
  specialty       TEXT,
  city            TEXT,
  state           TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  raw_json        TEXT,
  cached_at       TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vlp_professionals_cache_status
  ON vlp_professionals_cache (status);

CREATE INDEX IF NOT EXISTS idx_vlp_professionals_cache_specialty
  ON vlp_professionals_cache (specialty);

CREATE INDEX IF NOT EXISTS idx_vlp_professionals_cache_city
  ON vlp_professionals_cache (city);
