import type { EvaluationPlanScope } from './EvaluationPlan.js';

export type EvaluationSelectionContextProps = {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly executionContext: string;
  readonly scope: EvaluationPlanScope;
  readonly selectedCriterionIds: readonly string[];
};

export class EvaluationSelectionContext {
  public constructor(public readonly props: EvaluationSelectionContextProps) {
    if (!props.scenarioId.trim()) throw new Error('Evaluation selection scenario id is required');
    if (!Number.isInteger(props.scenarioVersion) || props.scenarioVersion < 1) {
      throw new Error('Evaluation selection scenario version must be a positive integer');
    }
    if (!props.executionContext.trim()) throw new Error('Evaluation selection execution context is required');
    if (props.selectedCriterionIds.length === 0) {
      throw new Error('Evaluation selection must contain at least one criterion id');
    }

    const ids = new Set<string>();
    for (const criterionId of props.selectedCriterionIds) {
      if (!criterionId.trim()) throw new Error('Evaluation selection criterion id is required');
      if (ids.has(criterionId)) {
        throw new Error(`Duplicate selected criterion id: ${criterionId}`);
      }
      ids.add(criterionId);
    }
  }
}
