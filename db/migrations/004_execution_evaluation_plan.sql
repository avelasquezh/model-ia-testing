ALTER TABLE executions
  ADD COLUMN IF NOT EXISTS evaluation_plan JSONB;
