import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Execution } from '../../src/domain/execution/Execution.js';
import { ExecutionEvidence } from '../../src/domain/evidence/ExecutionEvidence.js';
import { Scenario } from '../../src/domain/scenario/Scenario.js';
import { Target } from '../../src/domain/target/Target.js';
import { PostgresDatabase } from '../../src/infrastructure/persistence/postgres/PostgresDatabase.js';
import { PostgresExecutionEvidenceRepository } from '../../src/infrastructure/persistence/postgres/PostgresExecutionEvidenceRepository.js';
import { PostgresExecutionRepository } from '../../src/infrastructure/persistence/postgres/PostgresExecutionRepository.js';

const requireDatabaseUrl = (): string => {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is required for the PostgreSQL traceability spike');
  return value;
};

describe.skipIf(!process.env.DATABASE_URL)('PostgreSQL execution traceability', () => {
  it('preserves Target → Scenario(version) → Execution → Evidence linkage', async () => {
    const database = new PostgresDatabase({ connectionString: requireDatabaseUrl() });
    const executionRepository = new PostgresExecutionRepository(database);
    const evidenceRepository = new PostgresExecutionEvidenceRepository(database);
    const targetId = `target-${randomUUID()}`;
    const scenarioId = `scenario-${randomUUID()}`;
    const executionId = `execution-${randomUUID()}`;
    const evidenceId = `evidence-${randomUUID()}`;
    const target = new Target({ id: targetId, name: 'Traceability target', url: 'https://example.test', status: 'ACTIVE' });
    const scenario = new Scenario({
      id: scenarioId,
      targetId,
      name: 'Traceability scenario',
      objective: 'Verify persistence traceability',
      description: 'A scenario used to validate the persisted execution chain',
      inputs: [{ value: 'Hola' }],
      expectedBehavior: 'The target responds to the conversation input',
      finishConditions: [{ description: 'A response is observed' }],
      version: 2,
    });
    const execution = new Execution({
      id: executionId,
      scenarioId,
      scenarioVersion: scenario.props.version,
      targetId: target.props.id,
      targetUrl: target.props.url,
      status: 'PASSED',
      startedAt: new Date('2026-09-06T15:00:00.000Z'),
      finishedAt: new Date('2026-09-06T15:00:01.000Z'),
      observations: [],
      errors: [],
    });
    const evidence = new ExecutionEvidence({
      id: evidenceId,
      executionId,
      targetId: target.props.id,
      targetUrl: target.props.url,
      scenarioVersion: scenario.props.version,
      testSystemVersion: '0.2.1',
      transcript: [],
      errors: [],
      capturedAt: new Date('2026-09-06T15:00:02.000Z'),
    });

    try {
      await database.query(
        `INSERT INTO targets (id, name, url, status) VALUES ($1, $2, $3, $4)`,
        [target.props.id, target.props.name, target.props.url, target.props.status],
      );
      await database.query(
        `INSERT INTO scenarios (
          id, version, target_id, name, objective, description,
          expected_behavior, inputs, finish_conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)`,
        [
          scenario.props.id,
          scenario.props.version,
          scenario.props.targetId,
          scenario.props.name,
          scenario.props.objective,
          scenario.props.description,
          scenario.props.expectedBehavior,
          JSON.stringify(scenario.props.inputs),
          JSON.stringify(scenario.props.finishConditions),
        ],
      );

      await executionRepository.save(execution);
      await evidenceRepository.save(evidence);

      const persistedExecution = await executionRepository.findById(executionId);
      const persistedEvidence = await evidenceRepository.findByExecutionId(executionId);
      const links = await database.query<{ execution_target_id: string; scenario_target_id: string; evidence_target_id: string; execution_scenario_version: number; evidence_scenario_version: number }>(
        `SELECT
          e.target_id AS execution_target_id,
          s.target_id AS scenario_target_id,
          ev.target_id AS evidence_target_id,
          e.scenario_version AS execution_scenario_version,
          ev.scenario_version AS evidence_scenario_version
        FROM executions e
        JOIN scenarios s ON s.id = e.scenario_id AND s.version = e.scenario_version
        JOIN execution_evidence ev ON ev.execution_id = e.id
        WHERE e.id = $1`,
        [executionId],
      );

      expect(persistedExecution?.props.targetId).toBe(targetId);
      expect(persistedExecution?.props.scenarioId).toBe(scenarioId);
      expect(persistedExecution?.props.scenarioVersion).toBe(2);
      expect(persistedEvidence?.props.executionId).toBe(executionId);
      expect(persistedEvidence?.props.targetId).toBe(targetId);
      expect(persistedEvidence?.props.scenarioVersion).toBe(2);
      expect(links.rows).toEqual([{
        execution_target_id: targetId,
        scenario_target_id: targetId,
        evidence_target_id: targetId,
        execution_scenario_version: 2,
        evidence_scenario_version: 2,
      }]);
    } finally {
      await database.query('DELETE FROM execution_evidence WHERE execution_id = $1', [executionId]);
      await database.query('DELETE FROM executions WHERE id = $1', [executionId]);
      await database.query('DELETE FROM scenarios WHERE id = $1 AND version = $2', [scenarioId, scenario.props.version]);
      await database.query('DELETE FROM targets WHERE id = $1', [targetId]);
      await database.close();
    }
  });
});
