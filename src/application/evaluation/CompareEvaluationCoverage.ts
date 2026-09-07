import type { EvaluationComparability } from '../../domain/evaluation/EvaluationComparability.js';
import { EvaluationCoverageComparison } from '../../domain/evaluation/EvaluationCoverageComparison.js';
import type { EvaluationCoverageMetrics } from '../../domain/evaluation/EvaluationCoverageMetrics.js';
import type { Execution } from '../../domain/execution/Execution.js';

export type CompareEvaluationCoverageInput = {
  readonly leftExecution: Execution;
  readonly rightExecution: Execution;
  readonly leftMetrics: EvaluationCoverageMetrics;
  readonly rightMetrics: EvaluationCoverageMetrics;
  readonly comparability: EvaluationComparability;
};

const ratioDelta = (left: number | null, right: number | null): number | null =>
  left === null || right === null ? null : right - left;

export class CompareEvaluationCoverage {
  public compare(input: CompareEvaluationCoverageInput): EvaluationCoverageComparison {
    if (input.comparability.props.leftExecutionId !== input.leftExecution.props.id ||
        input.comparability.props.rightExecutionId !== input.rightExecution.props.id) {
      throw new Error('Comparability execution ids must match the comparison executions');
    }
    if (input.comparability.props.status !== 'COMPARABLE') {
      throw new Error('Coverage comparison requires COMPARABLE executions');
    }
    if (input.leftMetrics.props.executionId !== input.leftExecution.props.id ||
        input.rightMetrics.props.executionId !== input.rightExecution.props.id) {
      throw new Error('Coverage metrics execution ids must match their executions');
    }

    const left = input.leftMetrics.props;
    const right = input.rightMetrics.props;

    return new EvaluationCoverageComparison({
      leftExecutionId: input.leftExecution.props.id,
      rightExecutionId: input.rightExecution.props.id,
      leftProductVersion: input.leftExecution.props.versionContext.props.productVersion,
      rightProductVersion: input.rightExecution.props.versionContext.props.productVersion,
      applicableCountDelta: right.applicableCount - left.applicableCount,
      evaluatedCountDelta: right.evaluatedCount - left.evaluatedCount,
      notEvaluatedCountDelta: right.notEvaluatedCount - left.notEvaluatedCount,
      insufficientEvidenceCountDelta: right.insufficientEvidenceCount - left.insufficientEvidenceCount,
      inconclusiveCountDelta: right.inconclusiveCount - left.inconclusiveCount,
      notApplicableCountDelta: right.notApplicableCount - left.notApplicableCount,
      evaluatedCoverageRatioDelta: ratioDelta(left.evaluatedCoverageRatio, right.evaluatedCoverageRatio),
      incompleteCoverageRatioDelta: ratioDelta(left.incompleteCoverageRatio, right.incompleteCoverageRatio),
      unresolvedCoverageRatioDelta: ratioDelta(left.unresolvedCoverageRatio, right.unresolvedCoverageRatio),
      basis: 'Descriptive coverage deltas are calculated as right execution minus left execution after methodological comparability has been established; product versions remain explicit dimensions and are not interpreted as quality judgments.',
    });
  }
}
