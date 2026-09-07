import { describe, expect, it } from 'vitest';
import { EvaluationCoverageInterpretation } from '../../src/domain/evaluation/EvaluationCoverageInterpretation.js';
import { MeasureEvaluationCoverage } from '../../src/application/evaluation/MeasureEvaluationCoverage.js';

describe('F2-37 architecture spike: coverage metrics', () => {
  const measure = new MeasureEvaluationCoverage();

  const interpretation = (props: Omit<EvaluationCoverageInterpretation['props'], 'basis'>) =>
    new EvaluationCoverageInterpretation({ ...props, basis: 'architecture spike basis' });

  it('measures complete coverage without treating it as acceptance', () => {
    const result = measure.measure(interpretation({
      executionId: 'spike-exec-1',
      status: 'COVERAGE_COMPLETE',
      applicableCriterionIds: ['C1', 'C2'],
      notApplicableCriterionIds: ['C3'],
      evaluatedCriterionIds: ['C1', 'C2'],
      notEvaluatedCriterionIds: [],
      insufficientEvidenceCriterionIds: [],
      inconclusiveCriterionIds: [],
    }));

    expect(result.props.applicableCount).toBe(2);
    expect(result.props.evaluatedCount).toBe(2);
    expect(result.props.notApplicableCount).toBe(1);
    expect(result.props.evaluatedCoverageRatio).toBe(1);
  });

  it('measures partial and unresolved coverage independently of decisions', () => {
    const partial = measure.measure(interpretation({
      executionId: 'spike-exec-2',
      status: 'COVERAGE_PARTIAL',
      applicableCriterionIds: ['C1', 'C2', 'C3'],
      notApplicableCriterionIds: [],
      evaluatedCriterionIds: ['C1'],
      notEvaluatedCriterionIds: ['C2'],
      insufficientEvidenceCriterionIds: ['C3'],
      inconclusiveCriterionIds: [],
    }));

    expect(partial.props.evaluatedCoverageRatio).toBeCloseTo(1 / 3);
    expect(partial.props.incompleteCoverageRatio).toBeCloseTo(2 / 3);
    expect(partial.props.unresolvedCoverageRatio).toBeCloseTo(1 / 3);

    const unresolved = measure.measure(interpretation({
      executionId: 'spike-exec-3',
      status: 'COVERAGE_UNRESOLVED',
      applicableCriterionIds: ['C1', 'C2'],
      notApplicableCriterionIds: [],
      evaluatedCriterionIds: [],
      notEvaluatedCriterionIds: [],
      insufficientEvidenceCriterionIds: ['C1'],
      inconclusiveCriterionIds: ['C2'],
    }));

    expect(unresolved.props.evaluatedCoverageRatio).toBe(0);
    expect(unresolved.props.incompleteCoverageRatio).toBe(1);
    expect(unresolved.props.unresolvedCoverageRatio).toBe(1);
  });

  it('represents zero-applicable coverage with null ratios instead of zero-denominator arithmetic', () => {
    const result = measure.measure(interpretation({
      executionId: 'spike-exec-4',
      status: 'NO_APPLICABLE_COVERAGE',
      applicableCriterionIds: [],
      notApplicableCriterionIds: ['C1', 'C2'],
      evaluatedCriterionIds: [],
      notEvaluatedCriterionIds: [],
      insufficientEvidenceCriterionIds: [],
      inconclusiveCriterionIds: [],
    }));

    expect(result.props.evaluatedCoverageRatio).toBeNull();
    expect(result.props.incompleteCoverageRatio).toBeNull();
    expect(result.props.unresolvedCoverageRatio).toBeNull();
  });
});
