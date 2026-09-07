import { describe, expect, it } from 'vitest';
import { EvaluationCoverage } from '../../src/domain/evaluation/EvaluationCoverage.js';
import { InterpretEvaluationCoverage } from '../../src/application/evaluation/InterpretEvaluationCoverage.js';

describe('F2-36 architecture spike: coverage interpretation', () => {
  const interpret = new InterpretEvaluationCoverage();
  const makeCoverage = (entries: EvaluationCoverage['props']['entries']) =>
    new EvaluationCoverage({ executionId: 'spike-exec-1', entries });

  it('keeps coverage interpretation independent from evaluation decision', () => {
    const result = interpret.interpret(makeCoverage([
      { criterionId: 'C1', status: 'APPLICABLE_EVALUATED', evaluationStatus: 'FAIL' },
      { criterionId: 'C2', status: 'NOT_APPLICABLE' },
    ]));

    expect(result.props.status).toBe('COVERAGE_COMPLETE');
    expect(result.props.notApplicableCriterionIds).toEqual(['C2']);
  });

  it('distinguishes partial coverage from unresolved coverage', () => {
    expect(interpret.interpret(makeCoverage([
      { criterionId: 'C1', status: 'APPLICABLE_EVALUATED', evaluationStatus: 'PASS' },
      { criterionId: 'C2', status: 'APPLICABLE_NOT_EVALUATED' },
    ])).props.status).toBe('COVERAGE_PARTIAL');

    expect(interpret.interpret(makeCoverage([
      { criterionId: 'C1', status: 'INSUFFICIENT_EVIDENCE', evaluationStatus: 'NOT_EVALUABLE' },
      { criterionId: 'C2', status: 'INCONCLUSIVE', evaluationStatus: 'INCONCLUSIVE' },
    ])).props.status).toBe('COVERAGE_UNRESOLVED');
  });

  it('distinguishes all-not-applicable from complete coverage', () => {
    const result = interpret.interpret(makeCoverage([
      { criterionId: 'C1', status: 'NOT_APPLICABLE' },
      { criterionId: 'C2', status: 'NOT_APPLICABLE' },
    ]));

    expect(result.props.status).toBe('NO_APPLICABLE_COVERAGE');
    expect(result.props.evaluatedCriterionIds).toEqual([]);
  });
});
