import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Execution } from '../../src/domain/execution/Execution.js';
import { ExecutionEvidence } from '../../src/domain/evidence/ExecutionEvidence.js';
import { PostgresDatabase } from '../../src/infrastructure/persistence/postgres/PostgresDatabase.js';
import { PostgresExecutionEvidenceRepository } from '../../src/infrastructure/persistence/postgres/PostgresExecutionEvidenceRepository.js';
import { PostgresExecutionRepository } from '../../src/infrastructure/persistence/postgres/PostgresExecutionRepository.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('PostgreSQL execution evidence repository', () => {
  it('persists and reconstructs evidence linked to an execution', async () => {
    const database = new PostgresDatabase({ connectionString: databaseUrl });
    const executionRepository = new PostgresExecutionRepository(database);
    const evidenceRepository = new PostgresExecutionEvidenceRepository(database);
    const targetId = `target-${randomUUID()}`;
    const scenarioId = `scenario-${randomUUID()}`;
    const executionId = `execution-${randomUUID()}`;
    const evidenceId = `evidence-${randomUUID()}`;
    const startedAt = new Date('2026-09-06T14:00:00.000Z');
    const observedAt = new Date('2026-09-06T14:00:01.250Z');
    const capturedAt = new Date('2026-09-06T14:00:02.000Z');
    const screenshot = new Uint8Array([7, 8, 9, 255]);

    try {
      await database.query(
        `INSERT INTO targets (id, name, url, status)
         VALUES ($1, $2, $3, 'ACTIVE')`,
        [targetId, 'Evidence target', 'https://example.test'],
      );
      await database.query(
        `INSERT INTO scenarios (
          id, version, target_id, name, objective, description,
          expected_behavior, inputs, finish_conditions
        ) VALUES ($1, 1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
        [
          scenarioId,
          targetId,
          'Evidence scenario',
          'Capture evidence',
          'Evidence roundtrip',
          'Evidence is reconstructed correctly',
          JSON.stringify([]),
          JSON.stringify([]),
        ],
      );

      await executionRepository.save(new Execution({
        id: executionId,
        scenarioId,
        scenarioVersion: 1,
        targetId,
        targetUrl: 'https://example.test',
        status: 'PASSED',
        startedAt,
        finishedAt: observedAt,
        observations: [{
          input: 'Hola',
          response: 'Hola',
          startedAt,
          observedAt,
          durationMs: 1250,
          screenshot,
        }],
        errors: [],
      }));

      const evidence = new ExecutionEvidence({
        id: evidenceId,
        executionId,
        targetId,
        targetUrl: 'https://example.test',
        scenarioVersion: 1,
        testSystemVersion: '0.2.0',
        transcript: [{
          input: 'Hola',
          response: 'Hola',
          startedAt,
          observedAt,
          durationMs: 1250,
          screenshot,
        }],
        errors: [{
          code: 'RECOVERED_TIMEOUT',
          message: 'Recovered transient timeout',
          operation: 'SEND',
          turnIndex: 1,
          occurredAt: new Date('2026-09-06T14:00:00.900Z'),
        }],
        capturedAt,
      });

      await evidenceRepository.save(evidence);
      const restored = await evidenceRepository.findByExecutionId(executionId);

      expect(restored).not.toBeUndefined();
      expect(restored?.props.id).toBe(evidenceId);
      expect(restored?.props.executionId).toBe(executionId);
      expect(restored?.props.targetId).toBe(targetId);
      expect(restored?.props.scenarioVersion).toBe(1);
      expect(restored?.props.testSystemVersion).toBe('0.2.0');
      expect(restored?.props.capturedAt).toEqual(capturedAt);
      expect(restored?.props.transcript[0]?.response).toBe('Hola');
      expect(Array.from(restored?.props.transcript[0]?.screenshot ?? [])).toEqual([7, 8, 9, 255]);
      expect(restored?.props.errors[0]).toEqual({
        code: 'RECOVERED_TIMEOUT',
        message: 'Recovered transient timeout',
        operation: 'SEND',
        turnIndex: 1,
        occurredAt: new Date('2026-09-06T14:00:00.900Z'),
      });

      await evidenceRepository.save(new ExecutionEvidence({
        ...evidence.props,
        id: `${evidenceId}-updated`,
        testSystemVersion: '0.2.1',
      }));
      const updated = await evidenceRepository.findByExecutionId(executionId);
      expect(updated?.props.id).toBe(`${evidenceId}-updated`);
      expect(updated?.props.testSystemVersion).toBe('0.2.1');
    } finally {
      await database.query('DELETE FROM execution_evidence WHERE execution_id = $1', [executionId]);
      await database.query('DELETE FROM executions WHERE id = $1', [executionId]);
      await database.query('DELETE FROM scenarios WHERE id = $1', [scenarioId]);
      await database.query('DELETE FROM targets WHERE id = $1', [targetId]);
      await database.close();
    }
  });

  it('returns undefined when evidence does not exist', async () => {
    const database = new PostgresDatabase({ connectionString: databaseUrl });
    const repository = new PostgresExecutionEvidenceRepository(database);
    try {
      await expect(repository.findByExecutionId(`missing-${randomUUID()}`)).resolves.toBeUndefined();
    } finally {
      await database.close();
    }
  });
});
