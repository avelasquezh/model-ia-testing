import { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import type { Criterion } from '../../domain/evaluation/Criterion.js';

export interface CriterionCatalog {
  findAll(): Promise<readonly Criterion[]>;
}

export type ComposeEvaluationPlanInput = {
  readonly executionId: string;
  readonly context: string;
};

export class ComposeEvaluationPlan {
  public constructor(private readonly catalog: CriterionCatalog) {}

  public async compose(input: ComposeEvaluationPlanInput): Promise<EvaluationPlan> {
    if (!input.executionId.trim()) throw new Error('Execution id is required');
    if (!input.context.trim()) throw new Error('Evaluation context is required');

    const criteria = await this.catalog.findAll();
    const duplicateIds = new Set<string>();
    const items = criteria.map((criterion) => {
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
          ? `Criterion applies to execution context '${input.context}'`
          : `Criterion does not apply to execution context '${input.context}'`,
        requiredEvidence: criterion.props.requiredEvidence,
        ruleVersion: criterion.props.ruleVersion,
      };
    });

    return new EvaluationPlan({
      executionId: input.executionId,
      context: input.context,
      items,
    });
  }
}
