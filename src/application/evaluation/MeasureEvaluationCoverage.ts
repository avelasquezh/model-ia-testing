import type { EvaluationCoverageInterpretation } from '../../domain/evaluation/EvaluationCoverageInterpretation.js';
import { EvaluationCoverageMetrics } from '../../domain/evaluation/EvaluationCoverageMetrics.js';

export class MeasureEvaluationCoverage {
  public measure(interpretation: EvaluationCoverageInterpretation): EvaluationCoverageMetrics {
    const applicableCount = interpretation.props.applicableCriterionIds.length;
    const evaluatedCount = interpretation.props.evaluatedCriterionIds.length;
    const notEvaluatedCount = interpretation.props.notEvaluatedCriterionIds.length;
    const insufficientEvidenceCount = interpretation.props.insufficientEvidenceCriterionIds.length;
    const inconclusiveCount = interpretation.props.inconclusiveCriterionIds.length;
    const notApplicableCount = interpretation.props.notApplicableCriterionIds.length;

    return new EvaluationCoverageMetrics({
      executionId: interpretation.props.executionId,
      applicableCount,
      evaluatedCount,
      notEvaluatedCount,
      insufficientEvidenceCount,
      inconclusiveCount,
      notApplicableCount,
      evaluatedCoverageRatio: applicableCount === 0 ? null : evaluatedCount / applicableCount,
      incompleteCoverageRatio: applicableCount === 0
        ? null
        : (notEvaluatedCount + insufficientEvidenceCount + inconclusiveCount) / applicableCount,
      unresolvedCoverageRatio: applicableCount === 0
        ? null
        : (insufficientEvidenceCount + inconclusiveCount) / applicableCount,
    });
  }
}
