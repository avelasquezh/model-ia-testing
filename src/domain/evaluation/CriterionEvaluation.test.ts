import { describe, expect, it } from 'vitest';
import { CriterionEvaluation } from './CriterionEvaluation.js';

describe('CriterionEvaluation', () => {
  it('requires traceability identifiers and decision information', () => {
    expect(
      () =>
        new CriterionEvaluation({
          criterionId: '',
          executionId: 'execution-1',
          evidenceId: 'evidence-1',
          status: 'PASS',
          rule: 'EXACT_RESPONSE_MATCH',
          reason: 'Matched',
          evaluatedAt: new Date(),
        }),
    ).toThrow('Criterion evaluation criterion id is required');
  });

  it('preserves the distinction between inconclusive and not evaluable', () => {
    const inconclusive = new CriterionEvaluation({
      criterionId: 'D1-C01',
      executionId: 'execution-1',
      evidenceId: 'evidence-1',
      status: 'INCONCLUSIVE',
      rule: 'EXACT_RESPONSE_MATCH',
      reason: 'Observed response unavailable',
      evaluatedAt: new Date(),
    });

    const notEvaluable = new CriterionEvaluation({
      criterionId: 'D1-C01',
      executionId: 'execution-2',
      evidenceId: 'evidence-2',
      status: 'NOT_EVALUABLE',
      rule: 'EXACT_RESPONSE_MATCH',
      reason: 'Expected response unavailable',
      evaluatedAt: new Date(),
    });

    expect(inconclusive.props.status).toBe('INCONCLUSIVE');
    expect(notEvaluable.props.status).toBe('NOT_EVALUABLE');
  });
});
