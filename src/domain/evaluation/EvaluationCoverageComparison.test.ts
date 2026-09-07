import { describe, expect, it } from 'vitest';
import { EvaluationCoverageComparison } from './EvaluationCoverageComparison.js';

describe('EvaluationCoverageComparison', () => {
  it('accepts descriptive count and ratio deltas', () => {
    const comparison = new EvaluationCoverageComparison({
      leftExecutionId: 'left',
      rightExecutionId: 'right',
      leftProductVersion: 'product-1',
      rightProductVersion: 'product-2',
      applicableCountDelta: 0,
      evaluatedCountDelta: 1,
      notEvaluatedCountDelta: -1,
      insufficientEvidenceCountDelta: 0,
      inconclusiveCountDelta: 0,
      notApplicableCountDelta: 0,
      evaluatedCoverageRatioDelta: 0.25,
      incompleteCoverageRatioDelta: -0.25,
      unresolvedCoverageRatioDelta: 0,
      basis: 'descriptive comparison',
    });

    expect(comparison.props.evaluatedCountDelta).toBe(1);
    expect(comparison.props.leftProductVersion).toBe('product-1');
    expect(comparison.props.rightProductVersion).toBe('product-2');
  });

  it('rejects comparing the same execution', () => {
    expect(() => new EvaluationCoverageComparison({
      leftExecutionId: 'same',
      rightExecutionId: 'same',
      leftProductVersion: 'product-1',
      rightProductVersion: 'product-1',
      applicableCountDelta: 0,
      evaluatedCountDelta: 0,
      notEvaluatedCountDelta: 0,
      insufficientEvidenceCountDelta: 0,
      inconclusiveCountDelta: 0,
      notApplicableCountDelta: 0,
      evaluatedCoverageRatioDelta: 0,
      incompleteCoverageRatioDelta: 0,
      unresolvedCoverageRatioDelta: 0,
      basis: 'descriptive comparison',
    })).toThrow('Coverage comparison requires two different executions');
  });
});
