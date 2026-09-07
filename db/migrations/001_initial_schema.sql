BEGIN;

CREATE TABLE IF NOT EXISTS targets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  target_id TEXT NOT NULL REFERENCES targets(id),
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_behavior TEXT NOT NULL,
  inputs JSONB NOT NULL,
  finish_conditions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, version)
);

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  scenario_version INTEGER NOT NULL,
  target_id TEXT NOT NULL REFERENCES targets(id),
  target_url TEXT NOT NULL,
  target_configuration JSONB,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'PARTIALLY_PASSED', 'INCONCLUSIVE', 'NOT_EVALUABLE', 'ERROR', 'CANCELLED')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_execution_scenario FOREIGN KEY (scenario_id, scenario_version) REFERENCES scenarios(id, version),
  CONSTRAINT execution_time_order CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_scenarios_target ON scenarios(target_id);
CREATE INDEX IF NOT EXISTS idx_executions_scenario ON executions(scenario_id, scenario_version);
CREATE INDEX IF NOT EXISTS idx_executions_target ON executions(target_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);

COMMIT;
