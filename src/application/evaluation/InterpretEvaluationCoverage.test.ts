import { describe, expect, it } from 'vitest';
import { EvaluationCoverage } from '../../domain/evaluation/EvaluationCoverage.js';
import { EvaluationCoverageInterpretation } from '../../domain/evaluation/EvaluationCoverageInterpretation.js';
import { InterpretEvaluationCoverage } from './InterpretEvaluationCoverage.js';

const interpret = new InterpretEvaluationCoverage();

const coverage = (...entries: EvaluationCoverage['props']['entries']) =>
  new EvaluationCoverage({ executionId: 'exec-1', entries });

describe('InterpretEvaluationCoverage', () => {
  it('returns COVERAGE_COMPLETE when all applicable criteria are evaluated', () => {
    const result = interpret.interpret(coverage(
      { criterionId: 'C1', status: 'APPLICABLE_EVALUATED', evaluationStatus: 'PASS' },
      { criterionId: 'C2', status: 'APPLICABLE_EVALUATED', evaluationStatus: 'FAIL' },
      { criterionId: 'C3', status: 'NOT_APPLICABLE' },
    ));

    expect(result.props.status).toBe('COVERAGE_COMPLETE');
    expect(result.props.applicableCriterionIds).toEqual(['C1', 'C2']);
    expect(result.props.evaluatedCriterionIds).toEqual(['C1', 'C2']);
    expect(result.props.notApplicableCriterionIds).toEqual(['C3']);
  });

  it('returns COVERAGE_PARTIAL when some applicable criteria are evaluated and others are incomplete', () => {
    const result = interpret.interpret(coverage(
      { criterionId: 'C1', status: 'APPLICABLE_EVALUATED', evaluationStatus: 'PASS' },
      { criterionId: 'C2', status: 'APPLICABLE_NOT_EVALUATED' },
      { criterionId: 'C3', status: 'INCONCLUSIVE', evaluationStatus: 'INCONCLUSIVE' },
    ));

    expect(result.props.status).toBe('COVERAGE_PARTIAL');
  });

  it('returns COVERAGE_UNRESOLVED when no applicable criterion is evaluated and uncertainty remains', () => {
    const result = interpret.interpret(coverage(
      { criterionId: 'C1', status: 'INSUFFICIENT_EVIDENCE', evaluationStatus: 'NOT_EVALUABLE' },
      { criterionId: 'C2', status: 'INCONCLUSIVE', evaluationStatus: 'INCONCLUSIVE' },
    ));

    expect(result.props.status).toBe('COVERAGE_UNRESOLVED');
  });

  it('returns NO_APPLICABLE_COVERAGE when every selected criterion is not applicable', () => {
    const result = interpret.interpret(coverage(
      { criterionId: 'C1', status: 'NOT_APPLICABLE' },
      { criterionId: 'C2', status: 'NOT_APPLICABLE' },
    ));

    expect(result.props.status).toBe('NO_APPLICABLE_COVERAGE');
    expect(result.props.applicableCriterionIds).toEqual([]);
    expect(result.props.notApplicableCriterionIds).toEqual(['C1', 'C2']);
  });

  it('does not equate complete coverage with acceptance', () => {
    const result = interpret.interpret(coverage(
      { criterionId: 'C1', status: 'APPLICABLE_EVALUATED', evaluationStatus: 'FAIL' },
    ));

    expect(result.props.status).toBe('COVERAGE_COMPLETE');
  });
});

describe('EvaluationCoverageInterpretation invariants', () => {
  const base = {
    executionId: 'exec-1',
    status: 'COVERAGE_COMPLETE' as const,
    applicableCriterionIds: ['C1'],
    notApplicableCriterionIds: [],
    evaluatedCriterionIds: ['C1'],
    notEvaluatedCriterionIds: [],
    insufficientEvidenceCriterionIds: [],
    inconclusiveCriterionIds: [],
    basis: 'deterministic test basis',
  };

  it('rejects criteria repeated inside interpretation groups', () => {
    expect(() => new EvaluationCoverageInterpretation({
      ...base,
      evaluatedCriterionIds: ['C1', 'C1'],
    })).toThrow('multiple coverage interpretation groups');
  });

  it('rejects COVERAGE_COMPLETE with unresolved criteria', () => {
    expect(() => new EvaluationCoverageInterpretation({
      ...base,
      evaluatedCriterionIds: [],
      notEvaluatedCriterionIds: ['C1'],
      status: 'COVERAGE_COMPLETE',
    })).toThrow('COVERAGE_COMPLETE cannot contain unresolved');
  });
});
