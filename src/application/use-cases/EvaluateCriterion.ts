import { CriterionEvaluation } from '../../domain/evaluation/CriterionEvaluation.js';
import { ResponseMatchesExpected } from '../../domain/evaluation/ResponseMatchesExpected.js';

export type EvaluateCriterionInput = {
  readonly criterionId: string;
  readonly executionId: string;
  readonly evidenceId: string;
  readonly expectedResponse: string;
  readonly observedResponse?: string;
};

export class EvaluateCriterion {
  public execute(input: EvaluateCriterionInput): CriterionEvaluation {
    if (!input.expectedResponse.trim()) {
      return new CriterionEvaluation({
        criterionId: input.criterionId,
        executionId: input.executionId,
        evidenceId: input.evidenceId,
        status: 'NOT_EVALUABLE',
        rule: 'EXACT_RESPONSE_MATCH',
        reason: 'Expected response is required to apply the decision rule',
        evaluatedAt: new Date(),
      });
    }

    if (input.observedResponse === undefined) {
      return new CriterionEvaluation({
        criterionId: input.criterionId,
        executionId: input.executionId,
        evidenceId: input.evidenceId,
        status: 'INCONCLUSIVE',
        rule: 'EXACT_RESPONSE_MATCH',
        reason: 'Observed response is unavailable in the supplied evidence',
        evaluatedAt: new Date(),
      });
    }

    const passed = ResponseMatchesExpected.evaluate({
      expected: input.expectedResponse,
      observed: input.observedResponse,
    });

    return new CriterionEvaluation({
      criterionId: input.criterionId,
      executionId: input.executionId,
      evidenceId: input.evidenceId,
      status: passed ? 'PASS' : 'FAIL',
      rule: 'EXACT_RESPONSE_MATCH',
      reason: passed
        ? 'Observed response matches the expected response'
        : 'Observed response does not match the expected response',
      evaluatedAt: new Date(),
    });
  }
}
