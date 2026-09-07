import { describe, expect, it } from 'vitest';
import { EvaluationCoverageComparison } from '../../src/domain/evaluation/EvaluationCoverageComparison.js';
import { InterpretEvaluationCoverageDifference } from '../../src/application/evaluation/InterpretEvaluationCoverageDifference.js';

describe('F2-40 architecture spike: coverage difference interpretation', () => {
  it('proves that interpretation is a versioned directional layer over F2-39 deltas', () => {
    const comparison = new EvaluationCoverageComparison({
      leftExecutionId: 'left',
      rightExecutionId: 'right',
      leftProductVersion: 'A',
      rightProductVersion: 'B',
      applicableCountDelta: 0,
      evaluatedCountDelta: 1,
      notEvaluatedCountDelta: -1,
      insufficientEvidenceCountDelta: 0,
      inconclusiveCountDelta: 0,
      notApplicableCountDelta: 0,
      evaluatedCoverageRatioDelta: 0.1,
      incompleteCoverageRatioDelta: -0.1,
      unresolvedCoverageRatioDelta: null,
      basis: 'F2-39 comparison',
    });

    const result = new InterpretEvaluationCoverageDifference().interpret({ comparison });

    expect(result.props.interpretationRuleVersion).toBe('f2-interpretation-0.1');
    expect(result.props.evaluatedCount).toBe('INCREASED');
    expect(result.props.notEvaluatedCount).toBe('DECREASED');
    expect(result.props.unresolvedCoverageRatio).toBe('NOT_INTERPRETABLE');
    expect(result.props.basis).toContain('No direction is translated into quality');
  });
});
