import { EvaluationPlan, type EvaluationPlanScope } from '../../domain/evaluation/EvaluationPlan.js';
import { isMvpCoreCriterion } from '../../domain/evaluation/MvpEvaluationScope.js';
import type { Criterion } from '../../domain/evaluation/Criterion.js';

export interface CriterionCatalog {
  findAll(): Promise<readonly Criterion[]>;
}

export type ComposeEvaluationPlanInput = {
  readonly executionId: string;
  readonly context: string;
  readonly scope?: EvaluationPlanScope;
};

export class ComposeEvaluationPlan {
  public constructor(private readonly catalog: CriterionCatalog) {}

  public async compose(input: ComposeEvaluationPlanInput): Promise<EvaluationPlan> {
    if (!input.executionId.trim()) throw new Error('Execution id is required');
    if (!input.context.trim()) throw new Error('Evaluation context is required');

    const scope = input.scope ?? 'CATALOG';
    const criteria = await this.catalog.findAll();
    const duplicateIds = new Set<string>();
    const items = criteria
      .filter((criterion) => scope === 'CATALOG' || isMvpCoreCriterion(criterion))
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
            ? `Criterion applies to execution context '${input.context}' within scope '${scope}'`
            : `Criterion does not apply to execution context '${input.context}' within scope '${scope}'`,
          requiredEvidence: criterion.props.requiredEvidence,
          ruleVersion: criterion.props.ruleVersion,
        };
      });

    return new EvaluationPlan({
      executionId: input.executionId,
      context: input.context,
      scope,
      items,
    });
  }
}
