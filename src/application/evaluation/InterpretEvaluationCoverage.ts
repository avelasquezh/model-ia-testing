import type { EvaluationCoverage } from '../../domain/evaluation/EvaluationCoverage.js';
import { EvaluationCoverageInterpretation } from '../../domain/evaluation/EvaluationCoverageInterpretation.js';

export class InterpretEvaluationCoverage {
  public interpret(coverage: EvaluationCoverage): EvaluationCoverageInterpretation {
    const applicableCriterionIds = coverage.props.entries
      .filter((entry) => entry.status !== 'NOT_APPLICABLE')
      .map((entry) => entry.criterionId);
    const notApplicableCriterionIds = coverage.props.entries
      .filter((entry) => entry.status === 'NOT_APPLICABLE')
      .map((entry) => entry.criterionId);
    const evaluatedCriterionIds = coverage.props.entries
      .filter((entry) => entry.status === 'APPLICABLE_EVALUATED')
      .map((entry) => entry.criterionId);
    const notEvaluatedCriterionIds = coverage.props.entries
      .filter((entry) => entry.status === 'APPLICABLE_NOT_EVALUATED')
      .map((entry) => entry.criterionId);
    const insufficientEvidenceCriterionIds = coverage.props.entries
      .filter((entry) => entry.status === 'INSUFFICIENT_EVIDENCE')
      .map((entry) => entry.criterionId);
    const inconclusiveCriterionIds = coverage.props.entries
      .filter((entry) => entry.status === 'INCONCLUSIVE')
      .map((entry) => entry.criterionId);

    const status = applicableCriterionIds.length === 0
      ? 'NO_APPLICABLE_COVERAGE'
      : notEvaluatedCriterionIds.length === 0 && insufficientEvidenceCriterionIds.length === 0 && inconclusiveCriterionIds.length === 0
        ? 'COVERAGE_COMPLETE'
        : evaluatedCriterionIds.length > 0
          ? 'COVERAGE_PARTIAL'
          : 'COVERAGE_UNRESOLVED';

    return new EvaluationCoverageInterpretation({
      executionId: coverage.props.executionId,
      status,
      applicableCriterionIds,
      notApplicableCriterionIds,
      evaluatedCriterionIds,
      notEvaluatedCriterionIds,
      insufficientEvidenceCriterionIds,
      inconclusiveCriterionIds,
      basis: `Coverage interpretation derived deterministically from ${coverage.props.entries.length} coverage entries`,
    });
  }
}
