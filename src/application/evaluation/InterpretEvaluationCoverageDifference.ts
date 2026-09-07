import { EvaluationCoverageDifferenceInterpretation } from '../../domain/evaluation/EvaluationCoverageDifferenceInterpretation.js';
import type { CoverageDifferenceDirection } from '../../domain/evaluation/EvaluationCoverageDifferenceInterpretation.js';
import type { EvaluationCoverageComparison } from '../../domain/evaluation/EvaluationCoverageComparison.js';

export const F2_40_INTERPRETATION_RULE_VERSION = 'f2-interpretation-0.1';

type Delta = number | null;

const directionOf = (delta: Delta): CoverageDifferenceDirection => {
  if (delta === null) return 'NOT_INTERPRETABLE';
  if (delta > 0) return 'INCREASED';
  if (delta < 0) return 'DECREASED';
  return 'UNCHANGED';
};

export type InterpretEvaluationCoverageDifferenceInput = {
  readonly comparison: EvaluationCoverageComparison;
  readonly interpretationRuleVersion?: string;
};

export class InterpretEvaluationCoverageDifference {
  public interpret(
    input: InterpretEvaluationCoverageDifferenceInput,
  ): EvaluationCoverageDifferenceInterpretation {
    const ruleVersion = input.interpretationRuleVersion ?? F2_40_INTERPRETATION_RULE_VERSION;
    if (ruleVersion !== F2_40_INTERPRETATION_RULE_VERSION) {
      throw new Error(`Unsupported F2-40 interpretation rule version: ${ruleVersion}`);
    }

    const comparison = input.comparison.props;
    return new EvaluationCoverageDifferenceInterpretation({
      leftExecutionId: comparison.leftExecutionId,
      rightExecutionId: comparison.rightExecutionId,
      leftProductVersion: comparison.leftProductVersion,
      rightProductVersion: comparison.rightProductVersion,
      interpretationRuleVersion: ruleVersion,
      applicableCount: directionOf(comparison.applicableCountDelta),
      evaluatedCount: directionOf(comparison.evaluatedCountDelta),
      notEvaluatedCount: directionOf(comparison.notEvaluatedCountDelta),
      insufficientEvidenceCount: directionOf(comparison.insufficientEvidenceCountDelta),
      inconclusiveCount: directionOf(comparison.inconclusiveCountDelta),
      notApplicableCount: directionOf(comparison.notApplicableCountDelta),
      evaluatedCoverageRatio: directionOf(comparison.evaluatedCoverageRatioDelta),
      incompleteCoverageRatio: directionOf(comparison.incompleteCoverageRatioDelta),
      unresolvedCoverageRatio: directionOf(comparison.unresolvedCoverageRatioDelta),
      basis: 'F2-40 applies only the versioned directional rule to F2-39 descriptive deltas: positive means INCREASED, negative means DECREASED, zero means UNCHANGED, and null means NOT_INTERPRETABLE. No direction is translated into quality, improvement, regression, acceptance, rejection, or causality.',
    });
  }
}
