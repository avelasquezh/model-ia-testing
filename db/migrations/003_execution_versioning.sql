ALTER TABLE executions
  ADD COLUMN IF NOT EXISTS product_version TEXT,
  ADD COLUMN IF NOT EXISTS evaluation_method_version TEXT,
  ADD COLUMN IF NOT EXISTS criterion_catalog_version TEXT,
  ADD COLUMN IF NOT EXISTS decision_rules_version TEXT,
  ADD COLUMN IF NOT EXISTS evaluator_version TEXT,
  ADD COLUMN IF NOT EXISTS commit_sha TEXT;

UPDATE executions
SET
  product_version = COALESCE(product_version, '0.1.0'),
  evaluation_method_version = COALESCE(evaluation_method_version, 'legacy-unknown'),
  criterion_catalog_version = COALESCE(criterion_catalog_version, 'legacy-unknown'),
  decision_rules_version = COALESCE(decision_rules_version, 'legacy-unknown')
WHERE product_version IS NULL
   OR evaluation_method_version IS NULL
   OR criterion_catalog_version IS NULL
   OR decision_rules_version IS NULL;

ALTER TABLE executions
  ALTER COLUMN product_version SET NOT NULL,
  ALTER COLUMN evaluation_method_version SET NOT NULL,
  ALTER COLUMN criterion_catalog_version SET NOT NULL,
  ALTER COLUMN decision_rules_version SET NOT NULL;
