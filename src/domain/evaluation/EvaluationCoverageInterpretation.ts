import type { EvaluationCoverageStatus } from './EvaluationCoverage.js';

export const EVALUATION_COVERAGE_INTERPRETATION_STATUSES = [
  'COVERAGE_COMPLETE',
  'COVERAGE_PARTIAL',
  'COVERAGE_UNRESOLVED',
  'NO_APPLICABLE_COVERAGE',
] as const;

export type EvaluationCoverageInterpretationStatus =
  (typeof EVALUATION_COVERAGE_INTERPRETATION_STATUSES)[number];

export type EvaluationCoverageInterpretationProps = {
  readonly executionId: string;
  readonly status: EvaluationCoverageInterpretationStatus;
  readonly applicableCriterionIds: readonly string[];
  readonly notApplicableCriterionIds: readonly string[];
  readonly evaluatedCriterionIds: readonly string[];
  readonly notEvaluatedCriterionIds: readonly string[];
  readonly insufficientEvidenceCriterionIds: readonly string[];
  readonly inconclusiveCriterionIds: readonly string[];
  readonly basis: string;
};

export class EvaluationCoverageInterpretation {
  public constructor(public readonly props: EvaluationCoverageInterpretationProps) {
    if (!props.executionId.trim()) throw new Error('Evaluation coverage interpretation execution id is required');
    if (!props.basis.trim()) throw new Error('Evaluation coverage interpretation basis is required');

    const groups: readonly (readonly string[])[] = [
      props.applicableCriterionIds,
      props.notApplicableCriterionIds,
      props.evaluatedCriterionIds,
      props.notEvaluatedCriterionIds,
      props.insufficientEvidenceCriterionIds,
      props.inconclusiveCriterionIds,
    ];
    const seen = new Set<string>();
    for (const group of groups) {
      for (const criterionId of group) {
        if (!criterionId.trim()) throw new Error('Coverage interpretation criterion id is required');
        if (seen.has(criterionId)) {
          throw new Error(`Criterion appears in multiple coverage interpretation groups: ${criterionId}`);
        }
        seen.add(criterionId);
      }
    }

    const evaluatedSet = new Set(props.evaluatedCriterionIds);
    const notEvaluatedSet = new Set(props.notEvaluatedCriterionIds);
    const insufficientSet = new Set(props.insufficientEvidenceCriterionIds);
    const inconclusiveSet = new Set(props.inconclusiveCriterionIds);
    const notApplicableSet = new Set(props.notApplicableCriterionIds);
    const applicableSet = new Set(props.applicableCriterionIds);

    for (const criterionId of evaluatedSet) {
      if (!applicableSet.has(criterionId)) {
        throw new Error(`Evaluated criterion must be applicable: ${criterionId}`);
      }
    }
    for (const criterionId of notEvaluatedSet) {
      if (!applicableSet.has(criterionId)) {
        throw new Error(`Not-evaluated criterion must be applicable: ${criterionId}`);
      }
    }
    for (const criterionId of insufficientSet) {
      if (!applicableSet.has(criterionId)) {
        throw new Error(`Insufficient-evidence criterion must be applicable: ${criterionId}`);
      }
    }
    for (const criterionId of inconclusiveSet) {
      if (!applicableSet.has(criterionId)) {
        throw new Error(`Inconclusive criterion must be applicable: ${criterionId}`);
      }
    }
    for (const criterionId of notApplicableSet) {
      if (applicableSet.has(criterionId)) {
        throw new Error(`Criterion cannot be both applicable and not applicable: ${criterionId}`);
      }
    }

    const classifiedApplicable = new Set([
      ...props.evaluatedCriterionIds,
      ...props.notEvaluatedCriterionIds,
      ...props.insufficientEvidenceCriterionIds,
      ...props.inconclusiveCriterionIds,
    ]);
    if (classifiedApplicable.size !== applicableSet.size) {
      throw new Error('Coverage interpretation applicable criteria must be completely classified');
    }

    if (props.status === 'NO_APPLICABLE_COVERAGE' && applicableSet.size > 0) {
      throw new Error('NO_APPLICABLE_COVERAGE requires zero applicable criteria');
    }
    if (props.status !== 'NO_APPLICABLE_COVERAGE' && applicableSet.size === 0) {
      throw new Error('Non-empty applicable coverage is required for this interpretation status');
    }
    if (props.status === 'COVERAGE_COMPLETE' &&
      (notEvaluatedSet.size > 0 || insufficientSet.size > 0 || inconclusiveSet.size > 0)) {
      throw new Error('COVERAGE_COMPLETE cannot contain unresolved applicable criteria');
    }
    if (props.status === 'COVERAGE_PARTIAL' && evaluatedSet.size === 0) {
      throw new Error('COVERAGE_PARTIAL requires at least one evaluated criterion');
    }
    if (props.status === 'COVERAGE_PARTIAL' &&
      notEvaluatedSet.size === 0 && insufficientSet.size === 0 && inconclusiveSet.size === 0) {
      throw new Error('COVERAGE_PARTIAL requires at least one incomplete or unresolved criterion');
    }
    if (props.status === 'COVERAGE_UNRESOLVED' && evaluatedSet.size > 0) {
      throw new Error('COVERAGE_UNRESOLVED cannot contain evaluated criteria');
    }
    if (props.status === 'COVERAGE_UNRESOLVED' &&
      insufficientSet.size === 0 && inconclusiveSet.size === 0) {
      throw new Error('COVERAGE_UNRESOLVED requires insufficient evidence or inconclusive criteria');
    }
  }

  public count(status: EvaluationCoverageStatus): number {
    switch (status) {
      case 'APPLICABLE_EVALUATED': return this.props.evaluatedCriterionIds.length;
      case 'APPLICABLE_NOT_EVALUATED': return this.props.notEvaluatedCriterionIds.length;
      case 'NOT_APPLICABLE': return this.props.notApplicableCriterionIds.length;
      case 'INSUFFICIENT_EVIDENCE': return this.props.insufficientEvidenceCriterionIds.length;
      case 'INCONCLUSIVE': return this.props.inconclusiveCriterionIds.length;
    }
  }
}
