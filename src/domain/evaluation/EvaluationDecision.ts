export const EVALUATION_DECISIONS = [
  'ACCEPTED',
  'REJECTED',
  'UNDECIDED',
] as const;

export type EvaluationDecision = (typeof EVALUATION_DECISIONS)[number];

export type EvaluationDecisionProps = {
  readonly decision: EvaluationDecision;
  readonly ruleVersion: string;
  readonly basis: string;
};

export class EvaluationDecisionResult {
  public constructor(public readonly props: EvaluationDecisionProps) {
    if (!props.ruleVersion.trim()) throw new Error('Evaluation decision rule version is required');
    if (!props.basis.trim()) throw new Error('Evaluation decision basis is required');
  }
}
