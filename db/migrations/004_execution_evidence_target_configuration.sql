ALTER TABLE execution_evidence
  ADD COLUMN IF NOT EXISTS target_configuration JSONB;
