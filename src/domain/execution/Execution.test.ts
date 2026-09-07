import { describe, expect, it } from 'vitest';
import { EvaluationPlan } from '../evaluation/EvaluationPlan.js';
import { EvaluationVersionContext } from '../versioning/EvaluationVersionContext.js';
import { Execution } from './Execution.js';

const versionContext = new EvaluationVersionContext({
  productVersion: '0.1.0',
  evaluationMethodVersion: 'f2-method-0.1',
  criterionCatalogVersion: 'f2-criteria-0.1',
  decisionRulesVersion: 'f2-rules-0.1',
});

const evaluationPlan = (executionId = 'execution-1', scenarioId = 'scenario-1', scenarioVersion = 1) => new EvaluationPlan({
  executionId,
  context: 'web-chatbot',
  scope: 'MVP_CORE',
  selectionContext: {
    scenarioId,
    scenarioVersion,
    executionContext: 'web-chatbot',
    scope: 'MVP_CORE',
    selectedCriterionIds: ['D1-C01'],
  },
  items: [{
    criterionId: 'D1-C01',
    dimensionId: 'D1',
    type: 'BOOLEAN',
    applicability: 'APPLICABLE',
    reason: 'Selected for web-chatbot',
    requiredEvidence: ['TRANSCRIPT'],
    ruleVersion: '1.0',
  }],
});

const pending = (withVersionContext = true) => new Execution({
  id: 'execution-1', scenarioId: 'scenario-1', scenarioVersion: 1,
  targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
  ...(withVersionContext ? { versionContext } : {}),
});

describe('Execution', () => {
  it('retains the immutable evaluation version context across its lifecycle', () => {
    const running = pending().start();
    const finished = running.finish('PASSED');

    expect(running.props.versionContext).toBe(versionContext);
    expect(finished.props.versionContext).toBe(versionContext);
  });

  it('retains the evaluation plan snapshot across its lifecycle', () => {
    const plan = evaluationPlan();
    const running = new Execution({
      ...pending().props,
      evaluationPlan: plan,
    }).start();
    const finished = running.finish('PASSED');

    expect(running.props.evaluationPlan).toBe(plan);
    expect(finished.props.evaluationPlan).toBe(plan);
  });

  it('rejects an evaluation plan bound to a different execution', () => {
    expect(() => new Execution({
      ...pending().props,
      evaluationPlan: evaluationPlan('different-execution'),
    })).toThrow('Execution evaluation plan id must match execution id');
  });

  it('rejects an evaluation plan bound to a different scenario', () => {
    expect(() => new Execution({
      ...pending().props,
      evaluationPlan: evaluationPlan('execution-1', 'scenario-2'),
    })).toThrow('Execution evaluation plan scenario id must match execution scenario id');
  });

  it('rejects an evaluation plan bound to a different scenario version', () => {
    expect(() => new Execution({
      ...pending().props,
      evaluationPlan: evaluationPlan('execution-1', 'scenario-1', 2),
    })).toThrow('Execution evaluation plan scenario version must match execution scenario version');
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

  it('normalizes legacy executions without version context', () => {
    const execution = pending(false);

    expect(execution.props.versionContext.props.productVersion).toBe('legacy-unknown');
    expect(execution.props.versionContext.props.evaluationMethodVersion).toBe('legacy-unknown');
    expect(execution.props.versionContext.props.criterionCatalogVersion).toBe('legacy-unknown');
    expect(execution.props.versionContext.props.decisionRulesVersion).toBe('legacy-unknown');
  });

  it('prevents invalid lifecycle transitions', () => {
    expect(() => pending().finish('PASSED')).toThrow('Only running executions can finish');
    expect(() => pending().start().start()).toThrow('Only pending executions can start');
  });
});
