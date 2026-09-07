export type EvaluationCoverageComparisonProps = {
  readonly leftExecutionId: string;
  readonly rightExecutionId: string;
  readonly leftProductVersion: string;
  readonly rightProductVersion: string;
  readonly applicableCountDelta: number;
  readonly evaluatedCountDelta: number;
  readonly notEvaluatedCountDelta: number;
  readonly insufficientEvidenceCountDelta: number;
  readonly inconclusiveCountDelta: number;
  readonly notApplicableCountDelta: number;
  readonly evaluatedCoverageRatioDelta: number | null;
  readonly incompleteCoverageRatioDelta: number | null;
  readonly unresolvedCoverageRatioDelta: number | null;
  readonly basis: string;
};

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

const assertRatioDelta = (name: string, value: number | null): void => {
  if (value !== null && !isFiniteNumber(value)) throw new Error(`${name} must be null or finite`);
};

export class EvaluationCoverageComparison {
  public constructor(public readonly props: EvaluationCoverageComparisonProps) {
    if (!props.leftExecutionId.trim()) throw new Error('Left execution id is required');
    if (!props.rightExecutionId.trim()) throw new Error('Right execution id is required');
    if (props.leftExecutionId === props.rightExecutionId) {
      throw new Error('Coverage comparison requires two different executions');
    }
    if (!props.leftProductVersion.trim()) throw new Error('Left product version is required');
    if (!props.rightProductVersion.trim()) throw new Error('Right product version is required');
    if (!props.basis.trim()) throw new Error('Coverage comparison basis is required');

    for (const delta of [
      props.applicableCountDelta,
      props.evaluatedCountDelta,
      props.notEvaluatedCountDelta,
      props.insufficientEvidenceCountDelta,
      props.inconclusiveCountDelta,
      props.notApplicableCountDelta,
    ]) {
      if (!Number.isInteger(delta)) throw new Error('Coverage count deltas must be integers');
    }

    assertRatioDelta('Evaluated coverage ratio delta', props.evaluatedCoverageRatioDelta);
    assertRatioDelta('Incomplete coverage ratio delta', props.incompleteCoverageRatioDelta);
    assertRatioDelta('Unresolved coverage ratio delta', props.unresolvedCoverageRatioDelta);
  }
}
