import { describe, expect, it } from 'vitest';
import { EvaluationCoverageDifferenceInterpretation } from './EvaluationCoverageDifferenceInterpretation.js';

describe('EvaluationCoverageDifferenceInterpretation', () => {
  const valid = () => new EvaluationCoverageDifferenceInterpretation({
    leftExecutionId: 'exec-a',
    rightExecutionId: 'exec-b',
    leftProductVersion: '0.1.0',
    rightProductVersion: '0.1.1',
    interpretationRuleVersion: 'f2-interpretation-0.1',
    applicableCount: 'INCREASED',
    evaluatedCount: 'DECREASED',
    notEvaluatedCount: 'UNCHANGED',
    insufficientEvidenceCount: 'NOT_INTERPRETABLE',
    inconclusiveCount: 'UNCHANGED',
    notApplicableCount: 'INCREASED',
    evaluatedCoverageRatio: 'DECREASED',
    incompleteCoverageRatio: 'INCREASED',
    unresolvedCoverageRatio: 'NOT_INTERPRETABLE',
    basis: 'test basis',
  });

  it('accepts a valid directional interpretation', () => {
    expect(valid().props.evaluatedCount).toBe('DECREASED');
  });

  it('rejects the same execution on both sides', () => {
    expect(() => new EvaluationCoverageDifferenceInterpretation({
      ...valid().props,
      rightExecutionId: 'exec-a',
    })).toThrow('two different executions');
  });

  it('requires the interpretation rule version', () => {
    expect(() => new EvaluationCoverageDifferenceInterpretation({
      ...valid().props,
      interpretationRuleVersion: ' ',
    })).toThrow('Interpretation rule version is required');
  });
});
