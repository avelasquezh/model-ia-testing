import { EvaluationPlan, type EvaluationPlanScope } from '../../domain/evaluation/EvaluationPlan.js';
import { EvaluationSelectionContext } from '../../domain/evaluation/EvaluationSelectionContext.js';
import { isMvpCoreCriterion } from '../../domain/evaluation/MvpEvaluationScope.js';
import type { Criterion } from '../../domain/evaluation/Criterion.js';

export interface CriterionCatalog {
  findAll(): Promise<readonly Criterion[]>;
}

export type ComposeEvaluationPlanInput = {
  readonly executionId: string;
  readonly context: string;
  readonly scope?: EvaluationPlanScope;
  readonly selection?: EvaluationSelectionContext;
};

export class ComposeEvaluationPlan {
  public constructor(private readonly catalog: CriterionCatalog) {}

  public async compose(input: ComposeEvaluationPlanInput): Promise<EvaluationPlan> {
    if (!input.executionId.trim()) throw new Error('Execution id is required');
    if (!input.context.trim()) throw new Error('Evaluation context is required');

    const scope = input.selection?.props.scope ?? input.scope ?? 'CATALOG';
    if (input.selection) {
      if (input.selection.props.executionContext !== input.context) {
        throw new Error('Evaluation selection context does not match execution context');
      }
    }

    const criteria = await this.catalog.findAll();
    const scopedCriteria = criteria.filter((criterion) => scope === 'CATALOG' || isMvpCoreCriterion(criterion));
    const selectedIds = input.selection ? new Set(input.selection.props.selectedCriterionIds) : undefined;

    if (selectedIds) {
      for (const criterionId of selectedIds) {
        if (!scopedCriteria.some((criterion) => criterion.props.id === criterionId)) {
          throw new Error(`Selected criterion is outside evaluation scope or missing from catalog: ${criterionId}`);
        }
      }
    }

    const duplicateIds = new Set<string>();
    const items = scopedCriteria
      .filter((criterion) => !selectedIds || selectedIds.has(criterion.props.id))
      .map((criterion) => {
        if (duplicateIds.has(criterion.props.id)) {
          throw new Error(`Duplicate criterion in catalog: ${criterion.props.id}`);
        }
        duplicateIds.add(criterion.props.id);

        const applicable = criterion.appliesTo(input.context);
        return {
          criterionId: criterion.props.id,
          dimensionId: criterion.props.dimensionId,
          type: criterion.props.type,
          applicability: applicable ? ('APPLICABLE' as const) : ('NOT_APPLICABLE' as const),
          reason: applicable
            ? `Criterion selected for execution context '${input.context}' within scope '${scope}'`
            : `Criterion selected but not applicable to execution context '${input.context}' within scope '${scope}'`,
          requiredEvidence: criterion.props.requiredEvidence,
          ruleVersion: criterion.props.ruleVersion,
        };
      });

    return new EvaluationPlan({
      executionId: input.executionId,
      context: input.context,
      scope,
      items,
      selectionContext: input.selection?.props,
    });
  }
}
