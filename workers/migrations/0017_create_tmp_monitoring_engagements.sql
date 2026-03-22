-- Migration: 0017_create_tmp_monitoring_engagements
-- Table: tmp_monitoring_engagements
-- Phase: 9 — CREATED now (Phase 2), APPLIED in Phase 9
-- Bronze/Silver/Gold/Snapshot/MFJ engagement records
-- professional_id null until tax pro self-claims (Phase 15) [Q8]
-- plan_end null for Snapshot engagements until second compliance report [Q9]
-- Cron Trigger (Phase 9) queries: WHERE status = 'active'
--   AND plan_end IS NOT NULL AND plan_end <= date('now')

CREATE TABLE IF NOT EXISTS tmp_monitoring_engagements (
  engagement_id          TEXT    NOT NULL PRIMARY KEY,
  account_id             TEXT    NOT NULL,
  professional_id        TEXT,
  plan_type              TEXT    NOT NULL,
  term_weeks             INTEGER NOT NULL DEFAULT 0,
  mfj_addon              INTEGER NOT NULL DEFAULT 0,
  status                 TEXT    NOT NULL DEFAULT 'pending',
  stripe_subscription_id TEXT,
  plan_start             TEXT,
  plan_end               TEXT,
  created_at             TEXT    NOT NULL,
  updated_at             TEXT    NOT NULL
);

-- plan_type: bronze | silver | gold | snapshot
-- status: pending | active | complete | cancelled
-- term_weeks: 6 (bronze) | 8 (silver) | 12 (gold) | 0 (snapshot)
-- mfj_addon: 0 | 1 (married filing jointly add-on)
-- stripe_subscription_id: null for snapshot (one-time payment)

CREATE INDEX IF NOT EXISTS idx_tmp_monitoring_engagements_account_id
  ON tmp_monitoring_engagements (account_id);

CREATE INDEX IF NOT EXISTS idx_tmp_monitoring_engagements_professional_id
  ON tmp_monitoring_engagements (professional_id);

CREATE INDEX IF NOT EXISTS idx_tmp_monitoring_engagements_status
  ON tmp_monitoring_engagements (status);

CREATE INDEX IF NOT EXISTS idx_tmp_monitoring_engagements_plan_type
  ON tmp_monitoring_engagements (plan_type);

-- Cron Trigger scan: active engagements with a non-null plan_end
CREATE INDEX IF NOT EXISTS idx_tmp_monitoring_engagements_plan_end
  ON tmp_monitoring_engagements (plan_end);

-- Phase 15 open-pool query: unclaimed engagements [Q8]
-- WHERE status = 'pending' AND professional_id IS NULL
CREATE INDEX IF NOT EXISTS idx_tmp_monitoring_engagements_open_pool
  ON tmp_monitoring_engagements (status, professional_id);
