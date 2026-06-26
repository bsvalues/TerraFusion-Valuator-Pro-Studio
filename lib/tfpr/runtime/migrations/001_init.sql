-- TFPR Slice 1 — initial schema (Postgres v0 of WorkfileStore + AuditTrace)
-- Every table is tenant-scoped (tenant_id NOT NULL) per TFPR_DECISION_RECORD §6.4.
-- trace_events is append-only by contract (runtime never UPDATE/DELETEs it).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Assignments (the unit of work shown in My Assignments)
CREATE TABLE IF NOT EXISTS tfpr_assignments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        TEXT NOT NULL,
  module_id        TEXT NOT NULL,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft',
  entitlement_tier TEXT NOT NULL DEFAULT 'trial',
  created_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subject (one opaque module-owned JSON blob per assignment)
CREATE TABLE IF NOT EXISTS tfpr_workfile_subjects (
  workfile_id  UUID PRIMARY KEY REFERENCES tfpr_assignments(id) ON DELETE CASCADE,
  tenant_id    TEXT NOT NULL,
  subject_json JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytical / governed runs
CREATE TABLE IF NOT EXISTS tfpr_workfile_runs (
  run_id          TEXT PRIMARY KEY,
  tenant_id       TEXT NOT NULL,
  workfile_id     UUID NOT NULL REFERENCES tfpr_assignments(id) ON DELETE CASCADE,
  run_type        TEXT NOT NULL,
  actor_id        TEXT NOT NULL,
  reason_code     TEXT NOT NULL,
  correlation_id  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  started_at      TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,
  input_snapshot  JSONB NOT NULL DEFAULT '{}',
  output_snapshot JSONB NOT NULL DEFAULT '{}',
  evidence_refs   JSONB NOT NULL DEFAULT '[]',
  narrative_ready BOOLEAN NOT NULL DEFAULT FALSE
);

-- Evidence ledger
CREATE TABLE IF NOT EXISTS tfpr_workfile_evidence (
  evidence_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    TEXT NOT NULL,
  workfile_id  UUID NOT NULL REFERENCES tfpr_assignments(id) ON DELETE CASCADE,
  source_type  TEXT NOT NULL,
  source_id    TEXT NOT NULL,
  source_label TEXT NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL,
  confidence   NUMERIC NOT NULL DEFAULT 1.0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MUSE drafts (write_low, non-final)
CREATE TABLE IF NOT EXISTS tfpr_workfile_drafts (
  draft_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      TEXT NOT NULL,
  workfile_id    UUID NOT NULL REFERENCES tfpr_assignments(id) ON DELETE CASCADE,
  capability_id  TEXT NOT NULL,
  draft_text     TEXT NOT NULL,
  provider_id    TEXT NOT NULL,
  is_final       BOOLEAN NOT NULL DEFAULT FALSE,
  risk           TEXT NOT NULL DEFAULT 'write_low',
  created_by     TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certified value (write_high; one per assignment — reconciliation final value)
CREATE TABLE IF NOT EXISTS tfpr_certified_values (
  workfile_id    UUID PRIMARY KEY REFERENCES tfpr_assignments(id) ON DELETE CASCADE,
  tenant_id      TEXT NOT NULL,
  value          NUMERIC NOT NULL,
  certified_by   TEXT NOT NULL,
  reason_code    TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  certified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit trail (APPEND-ONLY — runtime never updates or deletes rows here)
CREATE TABLE IF NOT EXISTS tfpr_trace_events (
  event_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      TEXT NOT NULL,
  workfile_id    UUID NOT NULL,
  type           TEXT NOT NULL,
  actor_id       TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  risk           TEXT,
  lane           TEXT,
  reason_code    TEXT,
  classification TEXT NOT NULL DEFAULT 'CONFIDENTIAL',
  summary        TEXT NOT NULL,
  payload_ref    TEXT
);

CREATE INDEX IF NOT EXISTS idx_tfpr_assignments_tenant ON tfpr_assignments(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tfpr_runs_workfile ON tfpr_workfile_runs(tenant_id, workfile_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tfpr_evidence_workfile ON tfpr_workfile_evidence(tenant_id, workfile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tfpr_drafts_workfile ON tfpr_workfile_drafts(tenant_id, workfile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tfpr_trace_workfile ON tfpr_trace_events(tenant_id, workfile_id, at);
