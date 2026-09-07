import type { Execution } from '../../domain/execution/Execution.js';
import type { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { EvaluationComparability, type EvaluationComparabilityReason } from '../../domain/evaluation/EvaluationComparability.js';

export type AssessEvaluationComparabilityInput = {
  readonly left: Execution;
  readonly right: Execution;
};

const LEGACY_UNKNOWN = 'legacy-unknown';

const sameIds = (left: readonly string[], right: readonly string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return new Set(left).size === left.length && left.every((id) => rightSet.has(id));
};

const applicabilitySignature = (plan: EvaluationPlan): readonly string[] =>
  plan.props.items
    .map((item) => `${item.criterionId}:${item.applicability}`)
    .sort();

const selectedIds = (plan: EvaluationPlan): readonly string[] =>
  plan.props.selectionContext
    ? plan.props.selectionContext.selectedCriterionIds
    : plan.props.items.map((item) => item.criterionId);

const hasLegacyVersionContext = (execution: Execution): boolean => {
  const context = execution.props.versionContext.props;
  return context.evaluationMethodVersion === LEGACY_UNKNOWN ||
    context.criterionCatalogVersion === LEGACY_UNKNOWN ||
    context.decisionRulesVersion === LEGACY_UNKNOWN;
};

const versionDiffers = (left: Execution, right: Execution): EvaluationComparabilityReason[] => {
  const reasons: EvaluationComparabilityReason[] = [];
  const l = left.props.versionContext.props;
  const r = right.props.versionContext.props;
  if (l.evaluationMethodVersion !== r.evaluationMethodVersion) reasons.push('EVALUATION_METHOD_VERSION_MISMATCH');
  if (l.criterionCatalogVersion !== r.criterionCatalogVersion) reasons.push('CRITERION_CATALOG_VERSION_MISMATCH');
  if (l.decisionRulesVersion !== r.decisionRulesVersion) reasons.push('DECISION_RULES_VERSION_MISMATCH');
  return reasons;
};

const validatePlanOwnership = (execution: Execution, plan: EvaluationPlan): void => {
  if (plan.props.executionId !== execution.props.id) {
    throw new Error(`Evaluation plan id does not match execution id: ${execution.props.id}`);
  }
  const selection = plan.props.selectionContext;
  if (selection) {
    if (selection.scenarioId !== execution.props.scenarioId) {
      throw new Error(`Evaluation plan selection scenario id does not match execution: ${execution.props.id}`);
    }
    if (selection.scenarioVersion !== execution.props.scenarioVersion) {
      throw new Error(`Evaluation plan selection scenario version does not match execution: ${execution.props.id}`);
    }
  }
};

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

export class AssessEvaluationComparability {
  public assess(input: AssessEvaluationComparabilityInput): EvaluationComparability {
    const leftId = input.left.props.id;
    const rightId = input.right.props.id;
    const reasons: EvaluationComparabilityReason[] = [];

    if (input.left.props.scenarioId !== input.right.props.scenarioId) reasons.push('SCENARIO_ID_MISMATCH');
    if (input.left.props.scenarioVersion !== input.right.props.scenarioVersion) reasons.push('SCENARIO_VERSION_MISMATCH');

    if (hasLegacyVersionContext(input.left) || hasLegacyVersionContext(input.right)) {
      reasons.push('LEGACY_VERSION_CONTEXT');
    } else {
      reasons.push(...versionDiffers(input.left, input.right));
    }

    if (input.left.props.conditionFingerprint === undefined || input.right.props.conditionFingerprint === undefined) {
      reasons.push('MISSING_CONDITION_FINGERPRINT');
    } else if (input.left.props.conditionFingerprint !== input.right.props.conditionFingerprint) {
      reasons.push('CONDITION_FINGERPRINT_MISMATCH');
    }

    const leftPlan = input.left.props.evaluationPlan;
    const rightPlan = input.right.props.evaluationPlan;

    if (!leftPlan || !rightPlan) {
      reasons.push('MISSING_EVALUATION_PLAN');
    } else {
      validatePlanOwnership(input.left, leftPlan);
      validatePlanOwnership(input.right, rightPlan);

      if (leftPlan.props.context !== rightPlan.props.context) reasons.push('EVALUATION_CONTEXT_MISMATCH');
      if (leftPlan.props.scope !== rightPlan.props.scope) reasons.push('EVALUATION_SCOPE_MISMATCH');
      if (!sameIds(selectedIds(leftPlan), selectedIds(rightPlan))) reasons.push('SELECTED_CRITERIA_MISMATCH');
      if (!sameIds(applicabilitySignature(leftPlan), applicabilitySignature(rightPlan))) reasons.push('APPLICABILITY_MISMATCH');
    }

    const uniqueReasons = [...new Set(reasons)];
    const hasHardIncompatibility = uniqueReasons.some((reason) => HARD_INCOMPATIBILITY_REASONS.has(reason));
    const hasInsufficientEvidence = uniqueReasons.some((reason) =>
      reason === 'MISSING_EVALUATION_PLAN' ||
      reason === 'MISSING_CONDITION_FINGERPRINT' ||
      reason === 'LEGACY_VERSION_CONTEXT',
    );

    const status = hasHardIncompatibility
      ? 'NON_COMPARABLE'
      : hasInsufficientEvidence
        ? 'INSUFFICIENT_EVIDENCE'
        : 'COMPARABLE';

    return new EvaluationComparability({
      leftExecutionId: leftId,
      rightExecutionId: rightId,
      status,
      reasons: uniqueReasons,
      basis: 'Comparability is derived from execution scenario identity, evaluation methodology context, condition fingerprint and evaluation-plan selection/applicability; target product identity remains an explicit comparison dimension.',
    });
  }
}
