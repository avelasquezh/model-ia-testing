import { describe, expect, it } from 'vitest';
import { EvaluateCriterion } from './EvaluateCriterion.js';

describe('EvaluateCriterion', () => {
  const useCase = new EvaluateCriterion();

  it('returns PASS when primary observed evidence matches the expected response', () => {
    const result = useCase.execute({
      criterionId: 'D1-C01',
      executionId: 'execution-1',
      evidenceId: 'evidence-1',
      expectedResponse: 'The order was created',
      observedResponse: 'The order was created',
    });

    expect(result.props.status).toBe('PASS');
    expect(result.props.rule).toBe('EXACT_RESPONSE_MATCH');
  });

  it('returns FAIL when evidence demonstrates a different response', () => {
    const result = useCase.execute({
      criterionId: 'D1-C01',
      executionId: 'execution-2',
      evidenceId: 'evidence-2',
      expectedResponse: 'The order was created',
      observedResponse: 'The order could not be created',
    });

    expect(result.props.status).toBe('FAIL');
  });

  it('returns INCONCLUSIVE when the criterion is evaluable but evidence is insufficient', () => {
    const result = useCase.execute({
      criterionId: 'D1-C01',
      executionId: 'execution-3',
      evidenceId: 'evidence-3',
      expectedResponse: 'The order was created',
    });

    expect(result.props.status).toBe('INCONCLUSIVE');
  });

  it('returns NOT_EVALUABLE when the expected condition is missing', () => {
    const result = useCase.execute({
      criterionId: 'D1-C01',
      executionId: 'execution-4',
      evidenceId: 'evidence-4',
      expectedResponse: '   ',
      observedResponse: 'The order was created',
    });

    expect(result.props.status).toBe('NOT_EVALUABLE');
  });
});
