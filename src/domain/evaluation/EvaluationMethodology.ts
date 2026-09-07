import type { CriterionEvidenceType, CriterionType } from './Criterion.js';

export const METHODOLOGY_STATUSES = ['DRAFT', 'VALIDATED'] as const;
export type MethodologyStatus = (typeof METHODOLOGY_STATUSES)[number];

export const EVALUATION_OUTCOMES = [
  'PASS',
  'FAIL',
  'PARTIAL',
  'INCONCLUSIVE',
  'NOT_EVALUABLE',
] as const;
export type EvaluationOutcome = (typeof EVALUATION_OUTCOMES)[number];

export type EvaluationDimension = {
  readonly id: string;
  readonly name: string;
  readonly objective: string;
};

export type EvaluationCriterionContract = {
  readonly id: string;
  readonly dimensionId: string;
  readonly type: CriterionType;
  readonly objective: string;
  readonly preconditions: readonly string[];
  readonly input: string;
  readonly expected: string;
  readonly requiredEvidence: readonly CriterionEvidenceType[];
  readonly decisionRule: string;
  readonly limitations: readonly string[];
  readonly measurementMethod?: string;
  readonly version: string;
};

export type EvaluationMethodologyProps = {
  readonly id: string;
  readonly version: string;
  readonly status: MethodologyStatus;
  readonly dimensions: readonly EvaluationDimension[];
  readonly criteria: readonly EvaluationCriterionContract[];
};

export class EvaluationMethodology {
  public constructor(public readonly props: EvaluationMethodologyProps) {
    if (!props.id.trim()) throw new Error('Methodology id is required');
    if (!props.version.trim()) throw new Error('Methodology version is required');
    if (props.dimensions.length === 0) throw new Error('Methodology must contain at least one dimension');
    if (props.criteria.length === 0) throw new Error('Methodology must contain at least one criterion');

    const dimensionIds = new Set<string>();
    for (const dimension of props.dimensions) {
      this.requireText(dimension.id, 'Dimension id');
      this.requireText(dimension.name, `Dimension ${dimension.id} name`);
      this.requireText(dimension.objective, `Dimension ${dimension.id} objective`);
      if (dimensionIds.has(dimension.id)) {
        throw new Error(`Duplicate methodology dimension: ${dimension.id}`);
      }
      dimensionIds.add(dimension.id);
    }

    const criterionIds = new Set<string>();
    for (const criterion of props.criteria) {
      this.requireText(criterion.id, 'Criterion id');
      this.requireText(criterion.dimensionId, `Criterion ${criterion.id} dimension id`);
      this.requireText(criterion.objective, `Criterion ${criterion.id} objective`);
      this.requireText(criterion.input, `Criterion ${criterion.id} input`);
      this.requireText(criterion.expected, `Criterion ${criterion.id} expected behavior`);
      this.requireText(criterion.decisionRule, `Criterion ${criterion.id} decision rule`);
      this.requireText(criterion.version, `Criterion ${criterion.id} version`);

      if (!dimensionIds.has(criterion.dimensionId)) {
        throw new Error(`Criterion ${criterion.id} references unknown dimension: ${criterion.dimensionId}`);
      }
      if (criterion.preconditions.length === 0) {
        throw new Error(`Criterion ${criterion.id} must declare at least one precondition`);
      }
      if (criterion.requiredEvidence.length === 0) {
        throw new Error(`Criterion ${criterion.id} must declare at least one required evidence type`);
      }
      if (criterion.limitations.length === 0) {
        throw new Error(`Criterion ${criterion.id} must declare at least one limitation`);
      }
      if (criterion.type === 'NUMERIC' && !criterion.measurementMethod?.trim()) {
        throw new Error(`Numeric criterion ${criterion.id} must declare a measurement method`);
      }
      if (criterionIds.has(criterion.id)) {
        throw new Error(`Duplicate methodology criterion: ${criterion.id}`);
      }
      criterionIds.add(criterion.id);
    }
  }

  public dimensionCriteria(dimensionId: string): readonly EvaluationCriterionContract[] {
    return this.props.criteria.filter((criterion) => criterion.dimensionId === dimensionId);
  }

  public static assertValidOutcome(outcome: string): asserts outcome is EvaluationOutcome {
    if (!(EVALUATION_OUTCOMES as readonly string[]).includes(outcome)) {
      throw new Error(`Unsupported evaluation outcome: ${outcome}`);
    }
  }

  private requireText(value: string, label: string): void {
    if (!value.trim()) throw new Error(`${label} is required`);
  }
}
