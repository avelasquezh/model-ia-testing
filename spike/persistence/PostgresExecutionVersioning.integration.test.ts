import { describe, expect, it } from 'vitest';
import { PostgresDatabase } from '../../src/infrastructure/persistence/postgres/PostgresDatabase.js';
import { PostgresExecutionRepository } from '../../src/infrastructure/persistence/postgres/PostgresExecutionRepository.js';
import { Execution } from '../../src/domain/execution/Execution.js';
import { EvaluationVersionContext } from '../../src/domain/versioning/EvaluationVersionContext.js';

describe('PostgreSQL execution versioning integration', () => {
  it('round-trips version references through the executions table', async () => {
    const database = new PostgresDatabase();
    const repository = new PostgresExecutionRepository(database);
    const context = new EvaluationVersionContext({
      productVersion: '0.1.0',
      evaluationMethodVersion: 'f2-method-0.1',
      criterionCatalogVersion: 'f2-criteria-0.1',
      decisionRulesVersion: 'f2-rules-0.1',
      evaluatorVersion: 'evaluator-integration-1',
      commitSha: 'integration-commit',
    });
    const execution = new Execution({
      id: `versioning-${Date.now()}`,
      scenarioId: 'scenario-1',
      scenarioVersion: 1,
      targetId: 'target-1',
      targetUrl: 'https://example.com',
      status: 'PENDING',
      versionContext: context,
    });

    try {
      await database.query(`
        INSERT INTO targets(id, name, url, status)
        VALUES ('target-1', 'Integration Target', 'https://example.com', 'ACTIVE')
        ON CONFLICT (id) DO NOTHING
      `);
      await database.query(`
        INSERT INTO scenarios(
          id, version, target_id, name, objective, description,
          expected_behavior, inputs, finish_conditions
        ) VALUES (
          'scenario-1', 1, 'target-1', 'Integration Scenario', 'Versioning',
          'Versioning integration', 'Persists version context', '[]'::jsonb, '[]'::jsonb
        ) ON CONFLICT (id, version) DO NOTHING
      `);

      await repository.save(execution);
      const restored = await repository.findById(execution.props.id);

      expect(restored?.props.versionContext.props).toEqual(context.props);
      expect(restored?.props.scenarioVersion).toBe(1);
      expect(restored?.props.status).toBe('PENDING');
    } finally {
      await database.query('DELETE FROM executions WHERE id = $1', [execution.props.id]);
      await database.close();
    }
  });
});
