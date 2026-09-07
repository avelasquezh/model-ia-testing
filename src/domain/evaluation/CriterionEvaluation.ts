export const CRITERION_EVALUATION_STATUSES = [
  'PASS',
  'FAIL',
  'INCONCLUSIVE',
  'NOT_EVALUABLE',
] as const;

export type CriterionEvaluationStatus = (typeof CRITERION_EVALUATION_STATUSES)[number];

export type CriterionEvaluationProps = {
  readonly criterionId: string;
  readonly executionId: string;
  readonly evidenceId: string;
  readonly status: CriterionEvaluationStatus;
  readonly rule: string;
  readonly reason: string;
  readonly evaluatedAt: Date;
};

export class CriterionEvaluation {
  public constructor(public readonly props: CriterionEvaluationProps) {
    if (!props.criterionId.trim()) throw new Error('Criterion evaluation criterion id is required');
    if (!props.executionId.trim()) throw new Error('Criterion evaluation execution id is required');
    if (!props.evidenceId.trim()) throw new Error('Criterion evaluation evidence id is required');
    if (!props.rule.trim()) throw new Error('Criterion evaluation rule is required');
    if (!props.reason.trim()) throw new Error('Criterion evaluation reason is required');
    if (!props.evaluatedAt) throw new Error('Criterion evaluation time is required');
  }
}
