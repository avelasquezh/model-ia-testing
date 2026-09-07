export type EvaluationCoverageMetricsProps = {
  readonly executionId: string;
  readonly applicableCount: number;
  readonly evaluatedCount: number;
  readonly notEvaluatedCount: number;
  readonly insufficientEvidenceCount: number;
  readonly inconclusiveCount: number;
  readonly notApplicableCount: number;
  readonly evaluatedCoverageRatio: number | null;
  readonly incompleteCoverageRatio: number | null;
  readonly unresolvedCoverageRatio: number | null;
};

const isNonNegativeInteger = (value: number): boolean =>
  Number.isInteger(value) && value >= 0;

const assertRatio = (name: string, value: number | null): void => {
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1)) {
    throw new Error(`${name} must be null or a number between 0 and 1`);
  }
};

export class EvaluationCoverageMetrics {
  public constructor(public readonly props: EvaluationCoverageMetricsProps) {
    if (!props.executionId.trim()) throw new Error('Evaluation coverage metrics execution id is required');

    const counts = [
      props.applicableCount,
      props.evaluatedCount,
      props.notEvaluatedCount,
      props.insufficientEvidenceCount,
      props.inconclusiveCount,
      props.notApplicableCount,
    ];
    for (const count of counts) {
      if (!isNonNegativeInteger(count)) throw new Error('Evaluation coverage metric counts must be non-negative integers');
    }

    if (
      props.evaluatedCount +
        props.notEvaluatedCount +
        props.insufficientEvidenceCount +
        props.inconclusiveCount !== props.applicableCount
    ) {
      throw new Error('Applicable coverage metrics must be completely distributed');
    }

    assertRatio('Evaluated coverage ratio', props.evaluatedCoverageRatio);
    assertRatio('Incomplete coverage ratio', props.incompleteCoverageRatio);
    assertRatio('Unresolved coverage ratio', props.unresolvedCoverageRatio);

    if (props.applicableCount === 0) {
      if (props.evaluatedCoverageRatio !== null || props.incompleteCoverageRatio !== null || props.unresolvedCoverageRatio !== null) {
        throw new Error('Coverage ratios must be null when no criterion is applicable');
      }
    } else {
      const expectedEvaluated = props.evaluatedCount / props.applicableCount;
      const expectedIncomplete =
        (props.notEvaluatedCount + props.insufficientEvidenceCount + props.inconclusiveCount) /
        props.applicableCount;
      const expectedUnresolved =
        (props.insufficientEvidenceCount + props.inconclusiveCount) /
        props.applicableCount;

      if (Math.abs((props.evaluatedCoverageRatio ?? -1) - expectedEvaluated) > Number.EPSILON) {
        throw new Error('Evaluated coverage ratio does not match its counts');
      }
      if (Math.abs((props.incompleteCoverageRatio ?? -1) - expectedIncomplete) > Number.EPSILON) {
        throw new Error('Incomplete coverage ratio does not match its counts');
      }
      if (Math.abs((props.unresolvedCoverageRatio ?? -1) - expectedUnresolved) > Number.EPSILON) {
        throw new Error('Unresolved coverage ratio does not match its counts');
      }
    }
  }
}
