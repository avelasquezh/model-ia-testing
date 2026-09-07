import { describe, expect, it } from 'vitest';
import { Execution } from '../execution/Execution.js';
import { RepetitionSet } from './RepetitionSet.js';
import { EvaluationVersionContext } from '../versioning/EvaluationVersionContext.js';

const versionContext = new EvaluationVersionContext({
  productVersion: '0.1.0',
  evaluationMethodVersion: 'f2-method-0.1',
  criterionCatalogVersion: 'f2-criteria-0.1',
  decisionRulesVersion: 'f2-rules-0.1',
});

const makeExecution = (id: string, status: Exclude<Execution['props']['status'], 'PENDING' | 'RUNNING'>, fingerprint = 'cond-A') =>
  new Execution({
    id,
    scenarioId: 'scenario-1',
    scenarioVersion: 2,
    targetId: 'target-1',
    targetUrl: 'https://example.com',
    status,
    versionContext,
    conditionFingerprint: fingerprint,
  });

describe('RepetitionSet', () => {
  it('requires independent terminal executions of the same scenario version', () => {
    const repetitions = new RepetitionSet({
      executions: [makeExecution('run-1', 'PASSED'), makeExecution('run-2', 'PASSED')],
    });

    expect(repetitions.props.executions).toHaveLength(2);
    expect(repetitions.scenarioId).toBe('scenario-1');
    expect(repetitions.scenarioVersion).toBe(2);
  });

  it('requires unique execution identities', () => {
    expect(() => new RepetitionSet({
      executions: [makeExecution('run-1', 'PASSED'), makeExecution('run-1', 'FAILED')],
    })).toThrow('Duplicate execution in repetition set: run-1');
  });

  it('rejects non-terminal executions', () => {
    const running = new Execution({
      id: 'run-1', scenarioId: 'scenario-1', scenarioVersion: 2,
      targetId: 'target-1', targetUrl: 'https://example.com', status: 'RUNNING',
      versionContext,
    });

    expect(() => new RepetitionSet({ executions: [running] })).toThrow(
      'Repetition requires a terminal execution status: run-1',
    );
  });

  it('rejects executions from different scenario versions', () => {
    const differentVersion = new Execution({
      id: 'run-2', scenarioId: 'scenario-1', scenarioVersion: 3,
      targetId: 'target-1', targetUrl: 'https://example.com', status: 'PASSED',
      versionContext, conditionFingerprint: 'cond-A',
    });

    expect(() => new RepetitionSet({
      executions: [makeExecution('run-1', 'PASSED'), differentVersion],
    })).toThrow('Repetition set executions must reference the same scenario version');
  });

  it('exposes whether conditions are comparable without inferring acceptability', () => {
    const comparable = new RepetitionSet({
      executions: [makeExecution('run-1', 'PASSED'), makeExecution('run-2', 'FAILED')],
    });
    const nonComparable = new RepetitionSet({
      executions: [makeExecution('run-3', 'PASSED', 'cond-A'), makeExecution('run-4', 'PASSED', 'cond-B')],
    });

    expect(comparable.hasComparableConditions).toBe(true);
    expect(nonComparable.hasComparableConditions).toBe(false);
  });

  it('preserves the distribution of individual outcomes', () => {
    const repetitions = new RepetitionSet({
      executions: [
        makeExecution('run-1', 'PASSED'),
        makeExecution('run-2', 'PASSED'),
        makeExecution('run-3', 'FAILED'),
        makeExecution('run-4', 'INCONCLUSIVE'),
        makeExecution('run-5', 'NOT_EVALUABLE'),
      ],
    });

    expect(repetitions.outcomeDistribution).toEqual({
      PASSED: 2,
      FAILED: 1,
      PARTIALLY_PASSED: 0,
      INCONCLUSIVE: 1,
      NOT_EVALUABLE: 1,
      ERROR: 0,
      CANCELLED: 0,
    });
  });
});
