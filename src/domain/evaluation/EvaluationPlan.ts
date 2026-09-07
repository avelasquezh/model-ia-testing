import type { CriterionEvidenceType, CriterionType } from './Criterion.js';
import type { EvaluationSelectionContextProps } from './EvaluationSelectionContext.js';

export const CRITERION_APPLICABILITY = ['APPLICABLE', 'NOT_APPLICABLE'] as const;
export type CriterionApplicability = (typeof CRITERION_APPLICABILITY)[number];

export const EVALUATION_PLAN_SCOPES = ['CATALOG', 'MVP_CORE'] as const;
export type EvaluationPlanScope = (typeof EVALUATION_PLAN_SCOPES)[number];

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
  readonly scope: EvaluationPlanScope;
  readonly items: readonly EvaluationPlanItemProps[];
  readonly selectionContext?: EvaluationSelectionContextProps;
};

export class EvaluationPlan {
  public constructor(public readonly props: EvaluationPlanProps) {
    if (!props.executionId.trim()) throw new Error('Evaluation plan execution id is required');
    if (!props.context.trim()) throw new Error('Evaluation plan context is required');
    if (props.items.length === 0) throw new Error('Evaluation plan must contain at least one criterion');

    if (props.selectionContext) {
      if (!props.selectionContext.scenarioId.trim()) {
        throw new Error('Evaluation plan selection scenario id is required');
      }
      if (!Number.isInteger(props.selectionContext.scenarioVersion) || props.selectionContext.scenarioVersion < 1) {
        throw new Error('Evaluation plan selection scenario version must be a positive integer');
      }
      if (!props.selectionContext.executionContext.trim()) {
        throw new Error('Evaluation plan selection execution context is required');
      }
      if (props.selectionContext.executionContext !== props.context) {
        throw new Error('Evaluation plan selection context does not match evaluation plan context');
      }
      if (props.selectionContext.scope !== props.scope) {
        throw new Error('Evaluation plan selection scope does not match evaluation plan scope');
      }
      if (props.selectionContext.selectedCriterionIds.length === 0) {
        throw new Error('Evaluation plan selection must contain at least one criterion id');
      }
    }

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

    if (props.selectionContext) {
      const selected = new Set(props.selectionContext.selectedCriterionIds);
      for (const item of props.items) {
        if (!selected.has(item.criterionId)) {
          throw new Error(`Evaluation plan contains unselected criterion: ${item.criterionId}`);
        }
      }
      for (const criterionId of selected) {
        if (!ids.has(criterionId)) {
          throw new Error(`Selected criterion is missing from evaluation plan: ${criterionId}`);
        }
      }
    }
  }

  public get applicableCriteria(): readonly EvaluationPlanItemProps[] {
    return this.props.items.filter((item) => item.applicability === 'APPLICABLE');
  }

  public get notApplicableCriteria(): readonly EvaluationPlanItemProps[] {
    return this.props.items.filter((item) => item.applicability === 'NOT_APPLICABLE');
  }
}
