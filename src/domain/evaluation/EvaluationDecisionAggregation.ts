import type { EvaluationDecisionResult } from './EvaluationDecision.js';

export const EVALUATION_AGGREGATION_OUTCOMES = [
  'ACCEPTED',
  'REJECTED',
  'UNDECIDED',
] as const;

export type EvaluationAggregationOutcome = (typeof EVALUATION_AGGREGATION_OUTCOMES)[number];

export type EvaluationDecisionInput = {
  readonly criterionId: string;
  readonly decision: EvaluationDecisionResult;
};

export type EvaluationDecisionAggregationProps = {
  readonly outcome: EvaluationAggregationOutcome;
  readonly criterionCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly undecidedCount: number;
  readonly evaluatedCriterionIds: readonly string[];
  readonly precedence: readonly EvaluationAggregationOutcome[];
  readonly basis: string;
};

export class EvaluationDecisionAggregationResult {
  public constructor(public readonly props: EvaluationDecisionAggregationProps) {
    if (props.criterionCount <= 0) {
      throw new Error('Evaluation decision aggregation requires at least one criterion');
    }
    if (props.acceptedCount + props.rejectedCount + props.undecidedCount !== props.criterionCount) {
      throw new Error('Evaluation decision aggregation counts must match criterion count');
    }
    if (props.evaluatedCriterionIds.length !== props.criterionCount) {
      throw new Error('Evaluation decision aggregation criterion ids must match criterion count');
    }
    if (new Set(props.evaluatedCriterionIds).size !== props.evaluatedCriterionIds.length) {
      throw new Error('Evaluation decision aggregation criterion ids must be unique');
    }
    if (props.precedence.length !== EVALUATION_AGGREGATION_OUTCOMES.length) {
      throw new Error('Evaluation decision aggregation precedence is incomplete');
    }
    if (new Set(props.precedence).size !== props.precedence.length) {
      throw new Error('Evaluation decision aggregation precedence must contain unique outcomes');
    }
    if (!props.basis.trim()) throw new Error('Evaluation decision aggregation basis is required');
  }
}
