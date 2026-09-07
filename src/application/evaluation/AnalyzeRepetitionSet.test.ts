import { describe, expect, it } from 'vitest';
import { Execution } from '../../domain/execution/Execution.js';
import { EvaluationVersionContext } from '../../domain/versioning/EvaluationVersionContext.js';
import { AnalyzeRepetitionSet } from './AnalyzeRepetitionSet.js';

const versionContext = new EvaluationVersionContext({
  productVersion: '0.1.0',
  evaluationMethodVersion: 'f2-method-0.1',
  criterionCatalogVersion: 'f2-criteria-0.1',
  decisionRulesVersion: 'f2-rules-0.1',
});

const execution = (
  id: string,
  status: Exclude<Execution['props']['status'], 'PENDING' | 'RUNNING'>,
  conditionFingerprint = 'cond-A',
) => new Execution({
  id,
  scenarioId: 'scenario-1',
  scenarioVersion: 2,
  targetId: 'target-1',
  targetUrl: 'https://example.com',
  status,
  versionContext,
  conditionFingerprint,
});

describe('AnalyzeRepetitionSet', () => {
  it('reports individual outcome distribution and comparability without collapsing outcomes into a score', () => {
    const analysis = new AnalyzeRepetitionSet().analyze({
      executions: [
        execution('run-1', 'PASSED'),
        execution('run-2', 'PASSED'),
        execution('run-3', 'FAILED'),
      ],
    });

    expect(analysis).toEqual({
      scenarioId: 'scenario-1',
      scenarioVersion: 2,
      repetitionCount: 3,
      conditionsComparable: true,
      outcomeDistribution: {
        PASSED: 2,
        FAILED: 1,
        PARTIALLY_PASSED: 0,
        INCONCLUSIVE: 0,
        NOT_EVALUABLE: 0,
        ERROR: 0,
        CANCELLED: 0,
      },
    });
  });

  it('exposes non-comparable conditions instead of interpreting them as behavioral variability', () => {
    const analysis = new AnalyzeRepetitionSet().analyze({
      executions: [
        execution('run-1', 'PASSED', 'cond-A'),
        execution('run-2', 'PASSED', 'cond-B'),
      ],
    });

    expect(analysis.conditionsComparable).toBe(false);
    expect(analysis.outcomeDistribution.PASSED).toBe(2);
  });

  it('preserves inconclusive and non-evaluable outcomes', () => {
    const analysis = new AnalyzeRepetitionSet().analyze({
      executions: [
        execution('run-1', 'INCONCLUSIVE'),
        execution('run-2', 'NOT_EVALUABLE'),
      ],
    });

    expect(analysis.outcomeDistribution.FAIL).toBeUndefined();
    expect(analysis.outcomeDistribution.FAILED).toBe(0);
    expect(analysis.outcomeDistribution.INCONCLUSIVE).toBe(1);
    expect(analysis.outcomeDistribution.NOT_EVALUABLE).toBe(1);
  });
});
