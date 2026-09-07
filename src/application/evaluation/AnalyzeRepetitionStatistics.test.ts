import { describe, expect, it } from 'vitest';
import { Execution } from '../../domain/execution/Execution.js';
import { EvaluationVersionContext } from '../../domain/versioning/EvaluationVersionContext.js';
import { AnalyzeRepetitionStatistics } from './AnalyzeRepetitionStatistics.js';

const versionContext = new EvaluationVersionContext({
  productVersion: '0.1.0',
  evaluationMethodVersion: 'f2-method-0.1',
  criterionCatalogVersion: 'f2-criteria-0.1',
  decisionRulesVersion: 'f2-rules-0.1',
});

const execution = (
  id: string,
  status: Exclude<Execution['props']['status'], 'PENDING' | 'RUNNING'>,
) => new Execution({
  id,
  scenarioId: 'scenario-1',
  scenarioVersion: 2,
  targetId: 'target-1',
  targetUrl: 'https://example.com',
  status,
  versionContext,
  conditionFingerprint: 'cond-A',
});

describe('AnalyzeRepetitionStatistics', () => {
  it('uses only evaluable outcomes as the denominator and preserves the full distribution', () => {
    const result = new AnalyzeRepetitionStatistics().analyze([
      execution('run-1', 'PASSED'),
      execution('run-2', 'PASSED'),
      execution('run-3', 'PARTIALLY_PASSED'),
      execution('run-4', 'FAILED'),
      execution('run-5', 'INCONCLUSIVE'),
      execution('run-6', 'NOT_EVALUABLE'),
      execution('run-7', 'ERROR'),
      execution('run-8', 'CANCELLED'),
    ]);

    expect(result.nTotal).toBe(8);
    expect(result.nEvaluable).toBe(4);
    expect(result.nPass).toBe(2);
    expect(result.nPartial).toBe(1);
    expect(result.nFail).toBe(1);
    expect(result.nInconclusive).toBe(1);
    expect(result.nNotEvaluable).toBe(1);
    expect(result.nError).toBe(1);
    expect(result.nCancelled).toBe(1);
    expect(result.passRate?.successes).toBe(2);
    expect(result.passRate?.trials).toBe(4);
    expect(result.failRate?.successes).toBe(1);
    expect(result.failRate?.trials).toBe(4);
  });

  it('returns Wilson uncertainty for evaluable outcome rates', () => {
    const result = new AnalyzeRepetitionStatistics().analyze([
      execution('run-1', 'PASSED'),
      execution('run-2', 'PASSED'),
      execution('run-3', 'FAILED'),
    ]);

    expect(result.passRate?.proportion).toBeCloseTo(2 / 3);
    expect(result.passRate?.confidenceInterval95.lower).toBeLessThan(2 / 3);
    expect(result.passRate?.confidenceInterval95.upper).toBeGreaterThan(2 / 3);
  });

  it('returns null rates when no repetition is evaluable', () => {
    const result = new AnalyzeRepetitionStatistics().analyze([
      execution('run-1', 'INCONCLUSIVE'),
      execution('run-2', 'NOT_EVALUABLE'),
    ]);

    expect(result.nEvaluable).toBe(0);
    expect(result.passRate).toBeNull();
    expect(result.partialRate).toBeNull();
    expect(result.failRate).toBeNull();
  });
});
