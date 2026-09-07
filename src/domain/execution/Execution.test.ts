import { describe, expect, it } from 'vitest';
import { EvaluationVersionContext } from '../versioning/EvaluationVersionContext.js';
import { Execution } from './Execution.js';

const versionContext = new EvaluationVersionContext({
  productVersion: '0.1.0',
  evaluationMethodVersion: 'f2-method-0.1',
  criterionCatalogVersion: 'f2-criteria-0.1',
  decisionRulesVersion: 'f2-rules-0.1',
});

const pending = () => new Execution({
  id: 'execution-1', scenarioId: 'scenario-1', scenarioVersion: 1,
  targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
  versionContext,
});

describe('Execution', () => {
  it('retains the immutable evaluation version context across its lifecycle', () => {
    const running = pending().start();
    const finished = running.finish('PASSED');

    expect(running.props.versionContext).toBe(versionContext);
    expect(finished.props.versionContext).toBe(versionContext);
  });

  it('transitions from pending to running and then to a terminal status', () => {
    const startedAt = new Date('2026-09-05T20:00:00Z');
    const finishedAt = new Date('2026-09-05T20:00:05Z');
    const running = pending().start(startedAt);
    const finished = running.finish('PASSED', finishedAt);

    expect(running.props.status).toBe('RUNNING');
    expect(running.props.startedAt).toBe(startedAt);
    expect(finished.props.status).toBe('PASSED');
    expect(finished.props.finishedAt).toBe(finishedAt);
  });

  it('prevents invalid lifecycle transitions', () => {
    expect(() => pending().finish('PASSED')).toThrow('Only running executions can finish');
    expect(() => pending().start().start()).toThrow('Only pending executions can start');
  });

  it('rejects executions without version context', () => {
    expect(() => new Execution({
      id: 'execution-1', scenarioId: 'scenario-1', scenarioVersion: 1,
      targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
      versionContext: undefined as never,
    })).toThrow('Execution version context is required');
  });
});
