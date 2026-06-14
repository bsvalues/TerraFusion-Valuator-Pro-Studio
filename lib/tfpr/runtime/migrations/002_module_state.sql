-- TFPR REC-002 — per-module JSON state (e.g. CompForge comp vault).
-- One JSON document per (workfile, module_key). Tenant-scoped. Survives reload.

CREATE TABLE IF NOT EXISTS tfpr_workfile_module_state (
  workfile_id UUID NOT NULL REFERENCES tfpr_assignments(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL,
  module_key  TEXT NOT NULL,
  state_json  JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workfile_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_tfpr_module_state_tenant
  ON tfpr_workfile_module_state(tenant_id, workfile_id);
