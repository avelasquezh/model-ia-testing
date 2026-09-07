import { describe, expect, it } from 'vitest';
import { EvaluationCoverageMetrics } from './EvaluationCoverageMetrics.js';

describe('EvaluationCoverageMetrics', () => {
  it('preserves the descriptive distribution of applicable and not-applicable criteria', () => {
    const metrics = new EvaluationCoverageMetrics({
      executionId: 'exec-1',
      applicableCount: 5,
      evaluatedCount: 2,
      notEvaluatedCount: 1,
      insufficientEvidenceCount: 1,
      inconclusiveCount: 1,
      notApplicableCount: 2,
      evaluatedCoverageRatio: 0.4,
      incompleteCoverageRatio: 0.6,
      unresolvedCoverageRatio: 0.4,
    });

    expect(metrics.props.applicableCount).toBe(5);
    expect(metrics.props.evaluatedCount).toBe(2);
    expect(metrics.props.notEvaluatedCount).toBe(1);
    expect(metrics.props.insufficientEvidenceCount).toBe(1);
    expect(metrics.props.inconclusiveCount).toBe(1);
    expect(metrics.props.notApplicableCount).toBe(2);
  });

  it('uses null ratios when no criterion is applicable', () => {
    const metrics = new EvaluationCoverageMetrics({
      executionId: 'exec-1',
      applicableCount: 0,
      evaluatedCount: 0,
      notEvaluatedCount: 0,
      insufficientEvidenceCount: 0,
      inconclusiveCount: 0,
      notApplicableCount: 3,
      evaluatedCoverageRatio: null,
      incompleteCoverageRatio: null,
      unresolvedCoverageRatio: null,
    });

    expect(metrics.props.evaluatedCoverageRatio).toBeNull();
    expect(metrics.props.incompleteCoverageRatio).toBeNull();
    expect(metrics.props.unresolvedCoverageRatio).toBeNull();
  });

  it('rejects a distribution that does not account for all applicable criteria', () => {
    expect(() => new EvaluationCoverageMetrics({
      executionId: 'exec-1',
      applicableCount: 2,
      evaluatedCount: 1,
      notEvaluatedCount: 0,
      insufficientEvidenceCount: 0,
      inconclusiveCount: 0,
      notApplicableCount: 1,
      evaluatedCoverageRatio: 0.5,
      incompleteCoverageRatio: 0.5,
      unresolvedCoverageRatio: 0,
    })).toThrow('completely distributed');
  });

  it('rejects ratios that disagree with their underlying counts', () => {
    expect(() => new EvaluationCoverageMetrics({
      executionId: 'exec-1',
      applicableCount: 2,
      evaluatedCount: 1,
      notEvaluatedCount: 1,
      insufficientEvidenceCount: 0,
      inconclusiveCount: 0,
      notApplicableCount: 0,
      evaluatedCoverageRatio: 1,
      incompleteCoverageRatio: 0,
      unresolvedCoverageRatio: 0,
    })).toThrow('Evaluated coverage ratio does not match');
  });
});
