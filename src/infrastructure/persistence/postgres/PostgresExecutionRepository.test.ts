import { describe, expect, it, vi } from 'vitest';
import { PostgresExecutionRepository } from './PostgresExecutionRepository.js';
import { Execution } from '../../../domain/execution/Execution.js';
import { EvaluationVersionContext } from '../../../domain/versioning/EvaluationVersionContext.js';
import type { PostgresDatabase } from './PostgresDatabase.js';

const versionContext = new EvaluationVersionContext({
  productVersion: '0.1.0',
  evaluationMethodVersion: 'f2-method-0.1',
  criterionCatalogVersion: 'f2-criteria-0.1',
  decisionRulesVersion: 'f2-rules-0.1',
  evaluatorVersion: 'evaluator-1',
  commitSha: 'abcdef123456',
});

const execution = new Execution({
  id: 'execution-1',
  scenarioId: 'scenario-1',
  scenarioVersion: 2,
  targetId: 'target-1',
  targetUrl: 'https://example.com',
  status: 'PENDING',
  versionContext,
});

describe('PostgresExecutionRepository', () => {
  it('persists version references as first-class execution fields', async () => {
    const query = vi.fn(async () => ({ rows: [], rowCount: 1 }));
    const database = { query } as unknown as PostgresDatabase;
    const repository = new PostgresExecutionRepository(database);

    await repository.save(execution);

    expect(query).toHaveBeenCalledTimes(1);
    const values = query.mock.calls[0]?.[1] as unknown[];
    expect(values).toEqual(expect.arrayContaining([
      '0.1.0',
      'f2-method-0.1',
      'f2-criteria-0.1',
      'f2-rules-0.1',
      'evaluator-1',
      'abcdef123456',
    ]));
  });

  it('reconstructs an execution and its version context from PostgreSQL rows', async () => {
    const database = {
      query: vi.fn(async () => ({
        rows: [{
          id: 'execution-1',
          scenario_id: 'scenario-1',
          scenario_version: 2,
          target_id: 'target-1',
          target_url: 'https://example.com',
          status: 'PASSED',
          product_version: '0.1.0',
          evaluation_method_version: 'f2-method-0.1',
          criterion_catalog_version: 'f2-criteria-0.1',
          decision_rules_version: 'f2-rules-0.1',
          evaluator_version: 'evaluator-1',
          commit_sha: 'abcdef123456',
          started_at: new Date('2026-09-07T01:00:00Z'),
          finished_at: new Date('2026-09-07T01:00:05Z'),
          observations: [{
            input: 'Hola', response: 'Hola',
            startedAt: '2026-09-07T01:00:01Z',
            observedAt: '2026-09-07T01:00:02Z',
            durationMs: 1000,
          }],
          errors: [],
        }],
      })),
    } as unknown as PostgresDatabase;
    const repository = new PostgresExecutionRepository(database);

    const restored = await repository.findById('execution-1');

    expect(restored?.props.id).toBe('execution-1');
    expect(restored?.props.status).toBe('PASSED');
    expect(restored?.props.versionContext.props.productVersion).toBe('0.1.0');
    expect(restored?.props.versionContext.props.evaluationMethodVersion).toBe('f2-method-0.1');
    expect(restored?.props.versionContext.props.criterionCatalogVersion).toBe('f2-criteria-0.1');
    expect(restored?.props.versionContext.props.decisionRulesVersion).toBe('f2-rules-0.1');
    expect(restored?.props.versionContext.props.evaluatorVersion).toBe('evaluator-1');
    expect(restored?.props.versionContext.props.commitSha).toBe('abcdef123456');
    expect(restored?.props.observations?.[0]?.response).toBe('Hola');
    expect(restored?.props.observations?.[0]?.durationMs).toBe(1000);
  });

  it('returns null when the execution does not exist', async () => {
    const database = {
      query: vi.fn(async () => ({ rows: [] })),
    } as unknown as PostgresDatabase;

    const repository = new PostgresExecutionRepository(database);

    await expect(repository.findById('missing')).resolves.toBeNull();
  });
});
