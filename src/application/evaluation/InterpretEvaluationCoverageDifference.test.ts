import { describe, expect, it } from 'vitest';
import { EvaluationCoverageComparison } from '../../domain/evaluation/EvaluationCoverageComparison.js';
import {
  F2_40_INTERPRETATION_RULE_VERSION,
  InterpretEvaluationCoverageDifference,
} from './InterpretEvaluationCoverageDifference.js';

describe('InterpretEvaluationCoverageDifference', () => {
  const comparison = new EvaluationCoverageComparison({
    leftExecutionId: 'exec-a',
    rightExecutionId: 'exec-b',
    leftProductVersion: '0.1.0',
    rightProductVersion: '0.1.1',
    applicableCountDelta: 0,
    evaluatedCountDelta: 2,
    notEvaluatedCountDelta: -2,
    insufficientEvidenceCountDelta: 0,
    inconclusiveCountDelta: 1,
    notApplicableCountDelta: -1,
    evaluatedCoverageRatioDelta: 0.25,
    incompleteCoverageRatioDelta: -0.25,
    unresolvedCoverageRatioDelta: null,
    basis: 'comparison basis',
  });

  it('maps positive, negative, zero and null deltas without quality judgment', () => {
    const result = new InterpretEvaluationCoverageDifference().interpret({ comparison });

    expect(result.props.interpretationRuleVersion).toBe(F2_40_INTERPRETATION_RULE_VERSION);
    expect(result.props.evaluatedCount).toBe('INCREASED');
    expect(result.props.notEvaluatedCount).toBe('DECREASED');
    expect(result.props.applicableCount).toBe('UNCHANGED');
    expect(result.props.unresolvedCoverageRatio).toBe('NOT_INTERPRETABLE');
    expect(result.props.leftProductVersion).toBe('0.1.0');
    expect(result.props.rightProductVersion).toBe('0.1.1');
  });

  it('rejects an unsupported interpretation rule version', () => {
    expect(() => new InterpretEvaluationCoverageDifference().interpret({
      comparison,
      interpretationRuleVersion: 'f2-interpretation-unsupported',
    })).toThrow('Unsupported F2-40 interpretation rule version');
  });
});
