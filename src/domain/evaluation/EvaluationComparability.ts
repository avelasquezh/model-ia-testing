export const EVALUATION_COMPARABILITY_STATUSES = [
  'COMPARABLE',
  'NON_COMPARABLE',
  'INSUFFICIENT_EVIDENCE',
] as const;

export type EvaluationComparabilityStatus = (typeof EVALUATION_COMPARABILITY_STATUSES)[number];

export const EVALUATION_COMPARABILITY_REASONS = [
  'SCENARIO_ID_MISMATCH',
  'SCENARIO_VERSION_MISMATCH',
  'EVALUATION_METHOD_VERSION_MISMATCH',
  'CRITERION_CATALOG_VERSION_MISMATCH',
  'DECISION_RULES_VERSION_MISMATCH',
  'EVALUATION_CONTEXT_MISMATCH',
  'EVALUATION_SCOPE_MISMATCH',
  'SELECTED_CRITERIA_MISMATCH',
  'APPLICABILITY_MISMATCH',
  'CONDITION_FINGERPRINT_MISMATCH',
  'MISSING_EVALUATION_PLAN',
  'MISSING_CONDITION_FINGERPRINT',
  'LEGACY_VERSION_CONTEXT',
] as const;

export type EvaluationComparabilityReason = (typeof EVALUATION_COMPARABILITY_REASONS)[number];

export type EvaluationComparabilityProps = {
  readonly leftExecutionId: string;
  readonly rightExecutionId: string;
  readonly status: EvaluationComparabilityStatus;
  readonly reasons: readonly EvaluationComparabilityReason[];
  readonly basis: string;
};

const INSUFFICIENT_EVIDENCE_REASONS = new Set<EvaluationComparabilityReason>([
  'MISSING_EVALUATION_PLAN',
  'MISSING_CONDITION_FINGERPRINT',
  'LEGACY_VERSION_CONTEXT',
]);

const HARD_INCOMPATIBILITY_REASONS = new Set<EvaluationComparabilityReason>([
  'SCENARIO_ID_MISMATCH',
  'SCENARIO_VERSION_MISMATCH',
  'EVALUATION_METHOD_VERSION_MISMATCH',
  'CRITERION_CATALOG_VERSION_MISMATCH',
  'DECISION_RULES_VERSION_MISMATCH',
  'EVALUATION_CONTEXT_MISMATCH',
  'EVALUATION_SCOPE_MISMATCH',
  'SELECTED_CRITERIA_MISMATCH',
  'APPLICABILITY_MISMATCH',
  'CONDITION_FINGERPRINT_MISMATCH',
]);

export class EvaluationComparability {
  public constructor(public readonly props: EvaluationComparabilityProps) {
    if (!props.leftExecutionId.trim()) throw new Error('Left execution id is required');
    if (!props.rightExecutionId.trim()) throw new Error('Right execution id is required');
    if (props.leftExecutionId === props.rightExecutionId) {
      throw new Error('Evaluation comparability requires two different executions');
    }
    if (!props.basis.trim()) throw new Error('Evaluation comparability basis is required');

    const reasons = new Set<EvaluationComparabilityReason>();
    for (const reason of props.reasons) {
      if (reasons.has(reason)) throw new Error(`Duplicate evaluation comparability reason: ${reason}`);
      reasons.add(reason);
    }

    const hasInsufficientReason = props.reasons.some((reason) => INSUFFICIENT_EVIDENCE_REASONS.has(reason));
    const hasHardIncompatibility = props.reasons.some((reason) => HARD_INCOMPATIBILITY_REASONS.has(reason));

    if (props.status === 'COMPARABLE' && reasons.size > 0) {
      throw new Error('COMPARABLE evaluation cannot contain incompatibility reasons');
    }
    if (props.status === 'NON_COMPARABLE' && !hasHardIncompatibility) {
      throw new Error('NON_COMPARABLE evaluation requires a concrete incompatibility reason');
    }
    if (props.status === 'INSUFFICIENT_EVIDENCE' && !hasInsufficientReason) {
      throw new Error('INSUFFICIENT_EVIDENCE requires an evidence insufficiency reason');
    }
    if (props.status === 'INSUFFICIENT_EVIDENCE' && hasHardIncompatibility) {
      throw new Error('INSUFFICIENT_EVIDENCE cannot coexist with a concrete incompatibility');
    }
  }
}
