ALTER TABLE executions
  ADD COLUMN IF NOT EXISTS condition_fingerprint TEXT;
