import { describe, expect, it } from 'vitest';
import { EvaluationCoverageInterpretation } from '../../domain/evaluation/EvaluationCoverageInterpretation.js';
import { MeasureEvaluationCoverage } from './MeasureEvaluationCoverage.js';

const measure = new MeasureEvaluationCoverage();

const interpretation = (props: Omit<EvaluationCoverageInterpretation['props'], 'basis'>) =>
  new EvaluationCoverageInterpretation({ ...props, basis: 'deterministic test basis' });

describe('MeasureEvaluationCoverage', () => {
  it('derives ratios from applicable criteria only', () => {
    const result = measure.measure(interpretation({
      executionId: 'exec-1',
      status: 'COVERAGE_PARTIAL',
      applicableCriterionIds: ['C1', 'C2', 'C3', 'C4', 'C5'],
      notApplicableCriterionIds: ['C6', 'C7'],
      evaluatedCriterionIds: ['C1', 'C2'],
      notEvaluatedCriterionIds: ['C3'],
      insufficientEvidenceCriterionIds: ['C4'],
      inconclusiveCriterionIds: ['C5'],
    }));

    expect(result.props.applicableCount).toBe(5);
    expect(result.props.notApplicableCount).toBe(2);
    expect(result.props.evaluatedCoverageRatio).toBeCloseTo(0.4);
    expect(result.props.incompleteCoverageRatio).toBeCloseTo(0.6);
    expect(result.props.unresolvedCoverageRatio).toBeCloseTo(0.4);
  });

  it('returns null ratios for NO_APPLICABLE_COVERAGE', () => {
    const result = measure.measure(interpretation({
      executionId: 'exec-1',
      status: 'NO_APPLICABLE_COVERAGE',
      applicableCriterionIds: [],
      notApplicableCriterionIds: ['C1', 'C2'],
      evaluatedCriterionIds: [],
      notEvaluatedCriterionIds: [],
      insufficientEvidenceCriterionIds: [],
      inconclusiveCriterionIds: [],
    }));

    expect(result.props.applicableCount).toBe(0);
    expect(result.props.notApplicableCount).toBe(2);
    expect(result.props.evaluatedCoverageRatio).toBeNull();
    expect(result.props.incompleteCoverageRatio).toBeNull();
    expect(result.props.unresolvedCoverageRatio).toBeNull();
  });
});
