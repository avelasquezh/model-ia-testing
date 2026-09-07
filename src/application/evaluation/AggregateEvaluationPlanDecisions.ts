import type { EvaluationDecisionResult } from '../../domain/evaluation/EvaluationDecision.js';
import type { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { AggregateEvaluationDecisions } from './AggregateEvaluationDecisions.js';
import type { EvaluationDecisionAggregationResult } from '../../domain/evaluation/EvaluationDecisionAggregation.js';

export type EvaluationPlanDecisionInput = {
  readonly criterionId: string;
  readonly decision: EvaluationDecisionResult;
};

export type AggregateEvaluationPlanDecisionsInput = {
  readonly plan: EvaluationPlan;
  readonly decisions: readonly EvaluationPlanDecisionInput[];
};

export class AggregateEvaluationPlanDecisions {
  private readonly aggregator = new AggregateEvaluationDecisions();

  public aggregate(input: AggregateEvaluationPlanDecisionsInput): EvaluationDecisionAggregationResult {
    const selectedIds = input.plan.props.selectionContext
      ? new Set(input.plan.props.selectionContext.selectedCriterionIds)
      : new Set(input.plan.props.items.map((item) => item.criterionId));

    const decisionIds = input.decisions.map((item) => item.criterionId);

    for (const criterionId of decisionIds) {
      if (!selectedIds.has(criterionId)) {
        throw new Error(`Decision provided for criterion outside evaluation plan selection: ${criterionId}`);
      }
    }

    const decisionIdSet = new Set(decisionIds);
    if (decisionIdSet.size !== decisionIds.length) {
      const duplicateCriterionId = decisionIds.find(
        (criterionId, index) => decisionIds.indexOf(criterionId) !== index,
      );
      throw new Error(`Duplicate criterion decision: ${duplicateCriterionId}`);
    }

    if (input.decisions.length !== selectedIds.size) {
      throw new Error('Evaluation plan decisions must contain exactly the selected criteria');
    }

    for (const criterionId of selectedIds) {
      if (!decisionIdSet.has(criterionId)) {
        throw new Error(`Missing decision for selected evaluation plan criterion: ${criterionId}`);
      }
    }

    const result = this.aggregator.aggregate({ decisions: input.decisions });

    return result;
  }
}
