import { describe, expect, it } from 'vitest';
import { PostgresDatabase } from '../../src/infrastructure/persistence/postgres/PostgresDatabase.js';
import { PostgresExecutionRepository } from '../../src/infrastructure/persistence/postgres/PostgresExecutionRepository.js';
import { Execution } from '../../src/domain/execution/Execution.js';
import { EvaluationVersionContext } from '../../src/domain/versioning/EvaluationVersionContext.js';

describe('PostgreSQL execution versioning integration', () => {
  const seedDependencies = async (database: PostgresDatabase) => {
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
  };

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
      scenarioId: 'scenario-1', scenarioVersion: 1,
      targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
      versionContext: context,
    });

    try {
      await seedDependencies(database);
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

  it('does not mutate historical version references when the same execution is updated', async () => {
    const database = new PostgresDatabase();
    const repository = new PostgresExecutionRepository(database);
    const originalContext = new EvaluationVersionContext({
      productVersion: '0.1.0',
      evaluationMethodVersion: 'method-v1',
      criterionCatalogVersion: 'criteria-v1',
      decisionRulesVersion: 'rules-v1',
    });
    const updatedContext = new EvaluationVersionContext({
      productVersion: '0.1.0',
      evaluationMethodVersion: 'method-v2',
      criterionCatalogVersion: 'criteria-v2',
      decisionRulesVersion: 'rules-v2',
    });
    const executionId = `historical-${Date.now()}`;

    const original = new Execution({
      id: executionId,
      scenarioId: 'scenario-1', scenarioVersion: 1,
      targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
      versionContext: originalContext,
    });
    const updated = new Execution({
      ...original.props,
      status: 'PASSED',
      finishedAt: new Date('2026-09-07T01:00:05Z'),
      versionContext: updatedContext,
    });

    try {
      await seedDependencies(database);
      await repository.save(original);
      await repository.save(updated);
      const restored = await repository.findById(executionId);

      expect(restored?.props.status).toBe('PASSED');
      expect(restored?.props.versionContext.props).toEqual(originalContext.props);
    } finally {
      await database.query('DELETE FROM executions WHERE id = $1', [executionId]);
      await database.close();
    }
  });

  it('keeps methodological contexts isolated across independent executions', async () => {
    const database = new PostgresDatabase();
    const repository = new PostgresExecutionRepository(database);
    const contextA = new EvaluationVersionContext({
      productVersion: '0.1.0',
      evaluationMethodVersion: 'method-a-v1',
      criterionCatalogVersion: 'criteria-a-v1',
      decisionRulesVersion: 'rules-a-v1',
      evaluatorVersion: 'evaluator-a',
    });
    const contextB = new EvaluationVersionContext({
      productVersion: '0.1.0',
      evaluationMethodVersion: 'method-b-v2',
      criterionCatalogVersion: 'criteria-b-v2',
      decisionRulesVersion: 'rules-b-v2',
      evaluatorVersion: 'evaluator-b',
    });
    const executionA = new Execution({
      id: `independent-a-${Date.now()}`,
      scenarioId: 'scenario-1', scenarioVersion: 1,
      targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
      versionContext: contextA,
    });
    const executionB = new Execution({
      id: `independent-b-${Date.now()}`,
      scenarioId: 'scenario-1', scenarioVersion: 1,
      targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
      versionContext: contextB,
    });

    try {
      await seedDependencies(database);
      await repository.save(executionA);
      await repository.save(executionB);

      const restoredA = await repository.findById(executionA.props.id);
      const restoredB = await repository.findById(executionB.props.id);

      expect(restoredA?.props.versionContext.props).toEqual(contextA.props);
      expect(restoredB?.props.versionContext.props).toEqual(contextB.props);
      expect(restoredA?.props.versionContext.props).not.toEqual(restoredB?.props.versionContext.props);
    } finally {
      await database.query('DELETE FROM executions WHERE id IN ($1, $2)', [
        executionA.props.id,
        executionB.props.id,
      ]);
      await database.close();
    }
  });
});
