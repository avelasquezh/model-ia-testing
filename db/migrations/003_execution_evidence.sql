CREATE TABLE IF NOT EXISTS execution_evidence (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL UNIQUE REFERENCES executions(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL,
  target_url TEXT NOT NULL,
  scenario_version INTEGER NOT NULL CHECK (scenario_version > 0),
  test_system_version TEXT NOT NULL,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT execution_evidence_target_url_not_blank CHECK (length(trim(target_url)) > 0),
  CONSTRAINT execution_evidence_test_system_version_not_blank CHECK (length(trim(test_system_version)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_execution_evidence_target_id
  ON execution_evidence (target_id);

CREATE INDEX IF NOT EXISTS idx_execution_evidence_captured_at
  ON execution_evidence (captured_at);
