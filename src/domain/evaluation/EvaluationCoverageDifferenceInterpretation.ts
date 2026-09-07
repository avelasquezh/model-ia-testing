export type CoverageDifferenceDirection =
  | 'INCREASED'
  | 'DECREASED'
  | 'UNCHANGED'
  | 'NOT_INTERPRETABLE';

export type EvaluationCoverageDifferenceInterpretationProps = {
  readonly leftExecutionId: string;
  readonly rightExecutionId: string;
  readonly leftProductVersion: string;
  readonly rightProductVersion: string;
  readonly interpretationRuleVersion: string;
  readonly applicableCount: CoverageDifferenceDirection;
  readonly evaluatedCount: CoverageDifferenceDirection;
  readonly notEvaluatedCount: CoverageDifferenceDirection;
  readonly insufficientEvidenceCount: CoverageDifferenceDirection;
  readonly inconclusiveCount: CoverageDifferenceDirection;
  readonly notApplicableCount: CoverageDifferenceDirection;
  readonly evaluatedCoverageRatio: CoverageDifferenceDirection;
  readonly incompleteCoverageRatio: CoverageDifferenceDirection;
  readonly unresolvedCoverageRatio: CoverageDifferenceDirection;
  readonly basis: string;
};

export class EvaluationCoverageDifferenceInterpretation {
  public constructor(public readonly props: EvaluationCoverageDifferenceInterpretationProps) {
    if (!props.leftExecutionId.trim()) throw new Error('Left execution id is required');
    if (!props.rightExecutionId.trim()) throw new Error('Right execution id is required');
    if (props.leftExecutionId === props.rightExecutionId) {
      throw new Error('Difference interpretation requires two different executions');
    }
    if (!props.leftProductVersion.trim()) throw new Error('Left product version is required');
    if (!props.rightProductVersion.trim()) throw new Error('Right product version is required');
    if (!props.interpretationRuleVersion.trim()) throw new Error('Interpretation rule version is required');
    if (!props.basis.trim()) throw new Error('Difference interpretation basis is required');
  }
}
