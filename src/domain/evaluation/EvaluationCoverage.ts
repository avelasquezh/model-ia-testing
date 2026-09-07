import type { CriterionEvaluationStatus } from './CriterionEvaluation.js';

export const EVALUATION_COVERAGE_STATUSES = [
  'APPLICABLE_EVALUATED',
  'APPLICABLE_NOT_EVALUATED',
  'NOT_APPLICABLE',
  'INSUFFICIENT_EVIDENCE',
  'INCONCLUSIVE',
] as const;

export type EvaluationCoverageStatus = (typeof EVALUATION_COVERAGE_STATUSES)[number];

export type EvaluationCoverageEntryProps = {
  readonly criterionId: string;
  readonly status: EvaluationCoverageStatus;
  readonly evaluationStatus?: CriterionEvaluationStatus;
};

export type EvaluationCoverageProps = {
  readonly executionId: string;
  readonly entries: readonly EvaluationCoverageEntryProps[];
};

export class EvaluationCoverage {
  public constructor(public readonly props: EvaluationCoverageProps) {
    if (!props.executionId.trim()) throw new Error('Evaluation coverage execution id is required');
    if (props.entries.length === 0) throw new Error('Evaluation coverage must contain at least one criterion');

    const ids = new Set<string>();
    for (const entry of props.entries) {
      if (!entry.criterionId.trim()) throw new Error('Evaluation coverage criterion id is required');
      if (ids.has(entry.criterionId)) {
        throw new Error(`Duplicate criterion in evaluation coverage: ${entry.criterionId}`);
      }
      ids.add(entry.criterionId);

      if (entry.status === 'NOT_APPLICABLE') {
        if (entry.evaluationStatus) {
          throw new Error(`NOT_APPLICABLE criterion cannot have an evaluation status: ${entry.criterionId}`);
        }
        continue;
      }

      if (entry.status === 'APPLICABLE_NOT_EVALUATED' && entry.evaluationStatus) {
        throw new Error(`APPLICABLE_NOT_EVALUATED criterion cannot have an evaluation status: ${entry.criterionId}`);
      }

      if (entry.status === 'APPLICABLE_EVALUATED' && entry.evaluationStatus !== 'PASS' && entry.evaluationStatus !== 'FAIL') {
        throw new Error(`APPLICABLE_EVALUATED criterion must have PASS or FAIL status: ${entry.criterionId}`);
      }

      if (entry.status === 'INSUFFICIENT_EVIDENCE' && entry.evaluationStatus !== 'NOT_EVALUABLE') {
        throw new Error(`INSUFFICIENT_EVIDENCE criterion must have NOT_EVALUABLE status: ${entry.criterionId}`);
      }

      if (entry.status === 'INCONCLUSIVE' && entry.evaluationStatus !== 'INCONCLUSIVE') {
        throw new Error(`INCONCLUSIVE criterion must have INCONCLUSIVE status: ${entry.criterionId}`);
      }
    }
  }

  public count(status: EvaluationCoverageStatus): number {
    return this.props.entries.filter((entry) => entry.status === status).length;
  }
}
