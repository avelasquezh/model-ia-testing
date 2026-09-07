import type { EvaluationDecisionResult } from '../../domain/evaluation/EvaluationDecision.js';
import {
  EvaluationDecisionAggregationResult,
  type EvaluationDecisionInput,
} from '../../domain/evaluation/EvaluationDecisionAggregation.js';

export type AggregateEvaluationDecisionsInput = {
  readonly decisions: readonly EvaluationDecisionInput[];
};

export class AggregateEvaluationDecisions {
  public aggregate(input: AggregateEvaluationDecisionsInput): EvaluationDecisionAggregationResult {
    if (input.decisions.length === 0) {
      throw new Error('Evaluation decision aggregation requires at least one criterion');
    }

    const criterionIds = input.decisions.map((item) => item.criterionId);
    if (criterionIds.some((criterionId) => !criterionId.trim())) {
      throw new Error('Evaluation decision aggregation criterion id is required');
    }
    if (new Set(criterionIds).size !== criterionIds.length) {
      throw new Error('Evaluation decision aggregation criterion ids must be unique');
    }

    const precedence = ['REJECTED', 'UNDECIDED', 'ACCEPTED'] as const;
    const outcome = this.resolveOutcome(input.decisions.map((item) => item.decision), precedence);

    return new EvaluationDecisionAggregationResult({
      outcome,
      criterionCount: input.decisions.length,
      acceptedCount: input.decisions.filter(({ decision }) => decision.props.decision === 'ACCEPTED').length,
      rejectedCount: input.decisions.filter(({ decision }) => decision.props.decision === 'REJECTED').length,
      undecidedCount: input.decisions.filter(({ decision }) => decision.props.decision === 'UNDECIDED').length,
      evaluatedCriterionIds: criterionIds,
      precedence,
      basis: `Aggregate decision resolved using explicit precedence ${precedence.join(' > ')}`,
    });
  }

  private resolveOutcome(
    decisions: readonly EvaluationDecisionResult[],
    precedence: readonly ('ACCEPTED' | 'REJECTED' | 'UNDECIDED')[],
  ): 'ACCEPTED' | 'REJECTED' | 'UNDECIDED' {
    for (const candidate of precedence) {
      if (decisions.some((decision) => decision.props.decision === candidate)) return candidate;
    }
    throw new Error('Evaluation decision aggregation could not resolve an outcome');
  }
}
