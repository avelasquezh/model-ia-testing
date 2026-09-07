import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Execution } from '../../src/domain/execution/Execution.js';
import { PostgresDatabase } from '../../src/infrastructure/persistence/postgres/PostgresDatabase.js';
import { PostgresExecutionRepository } from '../../src/infrastructure/persistence/postgres/PostgresExecutionRepository.js';

const databaseUrl = process.env.DATABASE_URL;

const requireDatabaseUrl = (): string => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for PostgreSQL repository integration tests');
  }
  return databaseUrl;
};

describe.skipIf(!databaseUrl)('PostgreSQL execution repository', () => {
  it('persists and reconstructs a complete execution', async () => {
    const database = new PostgresDatabase({ connectionString: requireDatabaseUrl() });
    const repository = new PostgresExecutionRepository(database);
    const targetId = `target-${randomUUID()}`;
    const scenarioId = `scenario-${randomUUID()}`;
    const executionId = `execution-${randomUUID()}`;
    const startedAt = new Date('2026-09-06T14:00:00.000Z');
    const finishedAt = new Date('2026-09-06T14:00:03.250Z');
    const observedAt = new Date('2026-09-06T14:00:03.000Z');
    const screenshot = new Uint8Array([0, 1, 2, 255]);

    try {
      await database.query(
        `INSERT INTO targets (id, name, url, status)
         VALUES ($1, $2, $3, 'ACTIVE')`,
        [targetId, 'Persistence target', 'https://example.test'],
      );
      await database.query(
        `INSERT INTO scenarios (
          id, version, target_id, name, objective, description,
          expected_behavior, inputs, finish_conditions
        ) VALUES ($1, 1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)`,
        [
          scenarioId,
          targetId,
          'Persistence scenario',
          'Verify persistence',
          'Roundtrip integration test',
          'The execution is reconstructed correctly',
          JSON.stringify([]),
          JSON.stringify([]),
        ],
      );

      const execution = new Execution({
        id: executionId,
        scenarioId,
        scenarioVersion: 1,
        targetId,
        targetUrl: 'https://example.test',
        status: 'PASSED',
        startedAt,
        finishedAt,
        observations: [
          {
            input: 'Hola',
            response: 'Hola, ¿en qué puedo ayudarte?',
            startedAt,
            observedAt,
            durationMs: 3250,
            screenshot,
          },
        ],
        errors: [
          {
            code: 'RETRYABLE_TIMEOUT',
            message: 'A transient timeout was recovered',
            operation: 'SEND',
            turnIndex: 1,
            occurredAt: new Date('2026-09-06T14:00:01.000Z'),
          },
        ],
      });

      await repository.save(execution);
      const restored = await repository.findById(executionId);

      expect(restored).not.toBeNull();
      expect(restored?.props.id).toBe(executionId);
      expect(restored?.props.scenarioId).toBe(scenarioId);
      expect(restored?.props.scenarioVersion).toBe(1);
      expect(restored?.props.targetId).toBe(targetId);
      expect(restored?.props.targetUrl).toBe('https://example.test');
      expect(restored?.props.status).toBe('PASSED');
      expect(restored?.props.startedAt).toEqual(startedAt);
      expect(restored?.props.finishedAt).toEqual(finishedAt);
      expect(restored?.props.observations?.[0]?.input).toBe('Hola');
      expect(restored?.props.observations?.[0]?.durationMs).toBe(3250);
      expect(Array.from(restored?.props.observations?.[0]?.screenshot ?? [])).toEqual([0, 1, 2, 255]);
      expect(restored?.props.errors?.[0]).toEqual({
        code: 'RETRYABLE_TIMEOUT',
        message: 'A transient timeout was recovered',
        operation: 'SEND',
        turnIndex: 1,
        occurredAt: new Date('2026-09-06T14:00:01.000Z'),
      });

      await repository.save(
        new Execution({
          ...execution.props,
          status: 'FAILED',
          finishedAt: new Date('2026-09-06T14:00:04.000Z'),
        }),
      );
      const updated = await repository.findById(executionId);
      expect(updated?.props.status).toBe('FAILED');
      expect(updated?.props.finishedAt).toEqual(new Date('2026-09-06T14:00:04.000Z'));
    } finally {
      await database.query('DELETE FROM executions WHERE id = $1', [executionId]);
      await database.query('DELETE FROM scenarios WHERE id = $1', [scenarioId]);
      await database.query('DELETE FROM targets WHERE id = $1', [targetId]);
      await database.close();
    }
  });

  it('returns null when the execution does not exist', async () => {
    const database = new PostgresDatabase({ connectionString: requireDatabaseUrl() });
    const repository = new PostgresExecutionRepository(database);
    try {
      await expect(repository.findById(`missing-${randomUUID()}`)).resolves.toBeNull();
    } finally {
      await database.close();
    }
  });
});
