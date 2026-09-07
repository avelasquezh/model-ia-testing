import type { CriterionEvaluation } from '../../domain/evaluation/CriterionEvaluation.js';
import type { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { EvaluationCoverage } from '../../domain/evaluation/EvaluationCoverage.js';

export type BuildEvaluationCoverageInput = {
  readonly plan: EvaluationPlan;
  readonly evaluations: readonly CriterionEvaluation[];
};

export class BuildEvaluationCoverage {
  public build(input: BuildEvaluationCoverageInput): EvaluationCoverage {
    const selectedIds = input.plan.props.selectionContext
      ? new Set(input.plan.props.selectionContext.selectedCriterionIds)
      : new Set(input.plan.props.items.map((item) => item.criterionId));
    const planItems = input.plan.props.items.filter((item) => selectedIds.has(item.criterionId));
    const planIds = new Set(planItems.map((item) => item.criterionId));
    const evaluationIds = input.evaluations.map((evaluation) => evaluation.props.criterionId);

    for (const criterionId of evaluationIds) {
      if (!planIds.has(criterionId)) {
        throw new Error(`Evaluation provided for criterion outside evaluation plan selection: ${criterionId}`);
      }
    }

    const evaluationIdSet = new Set(evaluationIds);
    if (evaluationIdSet.size !== evaluationIds.length) {
      const duplicateCriterionId = evaluationIds.find(
        (criterionId, index) => evaluationIds.indexOf(criterionId) !== index,
      );
      throw new Error(`Duplicate criterion evaluation: ${duplicateCriterionId}`);
    }

    const entries = planItems.map((item) => {
      if (item.applicability === 'NOT_APPLICABLE') {
        if (evaluationIdSet.has(item.criterionId)) {
          throw new Error(`Evaluation provided for NOT_APPLICABLE criterion: ${item.criterionId}`);
        }
        return {
          criterionId: item.criterionId,
          status: 'NOT_APPLICABLE' as const,
        };
      }

      const evaluation = input.evaluations.find((candidate) => candidate.props.criterionId === item.criterionId);
      if (!evaluation) {
        return {
          criterionId: item.criterionId,
          status: 'APPLICABLE_NOT_EVALUATED' as const,
        };
      }

      switch (evaluation.props.status) {
        case 'PASS':
        case 'FAIL':
          return {
            criterionId: item.criterionId,
            status: 'APPLICABLE_EVALUATED' as const,
            evaluationStatus: evaluation.props.status,
          };
        case 'NOT_EVALUABLE':
          return {
            criterionId: item.criterionId,
            status: 'INSUFFICIENT_EVIDENCE' as const,
            evaluationStatus: evaluation.props.status,
          };
        case 'INCONCLUSIVE':
          return {
            criterionId: item.criterionId,
            status: 'INCONCLUSIVE' as const,
            evaluationStatus: evaluation.props.status,
          };
      }
    });

    return new EvaluationCoverage({
      executionId: input.plan.props.executionId,
      entries,
    });
  }
}
