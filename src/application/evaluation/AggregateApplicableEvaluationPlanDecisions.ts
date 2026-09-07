import type { EvaluationDecisionResult } from '../../domain/evaluation/EvaluationDecision.js';
import type { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import type { EvaluationDecisionAggregationResult } from '../../domain/evaluation/EvaluationDecisionAggregation.js';
import { AggregateEvaluationDecisions } from './AggregateEvaluationDecisions.js';

export type ApplicablePlanDecisionInput = {
  readonly criterionId: string;
  readonly decision: EvaluationDecisionResult;
};

export type AggregateApplicableEvaluationPlanDecisionsInput = {
  readonly plan: EvaluationPlan;
  readonly decisions: readonly ApplicablePlanDecisionInput[];
};

export type ApplicableEvaluationPlanAggregationResult = {
  readonly aggregation: EvaluationDecisionAggregationResult | null;
  readonly applicableCriterionIds: readonly string[];
  readonly notApplicableCriterionIds: readonly string[];
};

export class AggregateApplicableEvaluationPlanDecisions {
  private readonly aggregator = new AggregateEvaluationDecisions();

  public aggregate(
    input: AggregateApplicableEvaluationPlanDecisionsInput,
  ): ApplicableEvaluationPlanAggregationResult {
    const selectedIds = input.plan.props.selectionContext
      ? new Set(input.plan.props.selectionContext.selectedCriterionIds)
      : new Set(input.plan.props.items.map((item) => item.criterionId));

    const applicableCriterionIds = input.plan.props.items
      .filter((item) => item.applicability === 'APPLICABLE')
      .map((item) => item.criterionId)
      .filter((criterionId) => selectedIds.has(criterionId));

    const notApplicableCriterionIds = input.plan.props.items
      .filter((item) => item.applicability === 'NOT_APPLICABLE')
      .map((item) => item.criterionId)
      .filter((criterionId) => selectedIds.has(criterionId));

    const applicableIds = new Set(applicableCriterionIds);
    const notApplicableIds = new Set(notApplicableCriterionIds);
    const decisionIds = input.decisions.map((item) => item.criterionId);

    for (const criterionId of decisionIds) {
      if (!selectedIds.has(criterionId)) {
        throw new Error(`Decision provided for criterion outside evaluation plan selection: ${criterionId}`);
      }
      if (notApplicableIds.has(criterionId)) {
        throw new Error(`Decision provided for NOT_APPLICABLE criterion: ${criterionId}`);
      }
      if (!applicableIds.has(criterionId)) {
        throw new Error(`Decision provided for criterion without APPLICABLE plan status: ${criterionId}`);
      }
    }

    const decisionIdSet = new Set(decisionIds);
    if (decisionIdSet.size !== decisionIds.length) {
      const duplicateCriterionId = decisionIds.find(
        (criterionId, index) => decisionIds.indexOf(criterionId) !== index,
      );
      throw new Error(`Duplicate criterion decision: ${duplicateCriterionId}`);
    }

    if (input.decisions.length !== applicableIds.size) {
      throw new Error('Applicable plan decisions must contain exactly the applicable criteria');
    }

    for (const criterionId of applicableIds) {
      if (!decisionIdSet.has(criterionId)) {
        throw new Error(`Missing decision for applicable evaluation plan criterion: ${criterionId}`);
      }
    }

    return {
      aggregation: applicableCriterionIds.length > 0
        ? this.aggregator.aggregate({ decisions: input.decisions })
        : null,
      applicableCriterionIds,
      notApplicableCriterionIds,
    };
  }
}
