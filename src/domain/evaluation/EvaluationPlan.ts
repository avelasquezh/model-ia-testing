import type { CriterionEvidenceType, CriterionType } from './Criterion.js';

export const CRITERION_APPLICABILITY = ['APPLICABLE', 'NOT_APPLICABLE'] as const;
export type CriterionApplicability = (typeof CRITERION_APPLICABILITY)[number];

export type EvaluationPlanItemProps = {
  readonly criterionId: string;
  readonly dimensionId: string;
  readonly type: CriterionType;
  readonly applicability: CriterionApplicability;
  readonly reason: string;
  readonly requiredEvidence: readonly CriterionEvidenceType[];
  readonly ruleVersion: string;
};

export type EvaluationPlanProps = {
  readonly executionId: string;
  readonly context: string;
  readonly items: readonly EvaluationPlanItemProps[];
};

export class EvaluationPlan {
  public constructor(public readonly props: EvaluationPlanProps) {
    if (!props.executionId.trim()) throw new Error('Evaluation plan execution id is required');
    if (!props.context.trim()) throw new Error('Evaluation plan context is required');
    if (props.items.length === 0) throw new Error('Evaluation plan must contain at least one criterion');

    const ids = new Set<string>();
    for (const item of props.items) {
      if (!item.criterionId.trim()) throw new Error('Evaluation plan criterion id is required');
      if (!item.dimensionId.trim()) throw new Error('Evaluation plan criterion dimension id is required');
      if (!item.reason.trim()) throw new Error('Evaluation plan criterion reason is required');
      if (item.requiredEvidence.length === 0) {
        throw new Error('Evaluation plan criterion must declare required evidence');
      }
      if (!item.ruleVersion.trim()) throw new Error('Evaluation plan criterion rule version is required');
      if (ids.has(item.criterionId)) {
        throw new Error(`Duplicate criterion in evaluation plan: ${item.criterionId}`);
      }
      ids.add(item.criterionId);
    }
  }

  public get applicableCriteria(): readonly EvaluationPlanItemProps[] {
    return this.props.items.filter((item) => item.applicability === 'APPLICABLE');
  }

  public get notApplicableCriteria(): readonly EvaluationPlanItemProps[] {
    return this.props.items.filter((item) => item.applicability === 'NOT_APPLICABLE');
  }
}
