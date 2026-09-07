import type { CriterionEvaluationStatus } from '../../domain/evaluation/CriterionEvaluation.js';
import { EvaluationDecisionResult } from '../../domain/evaluation/EvaluationDecision.js';

export type ExplicitEvaluationDecisionRule = {
  readonly version: string;
  readonly decide: (status: CriterionEvaluationStatus) => 'ACCEPTED' | 'REJECTED' | 'UNDECIDED';
};

export type BuildEvaluationDecisionInput = {
  readonly criterionEvaluationStatus: CriterionEvaluationStatus;
  readonly rule: ExplicitEvaluationDecisionRule;
};

export class BuildEvaluationDecision {
  public build(input: BuildEvaluationDecisionInput): EvaluationDecisionResult {
    if (!input.rule.version.trim()) {
      throw new Error('Evaluation decision rule version is required');
    }

    const decision = input.rule.decide(input.criterionEvaluationStatus);

    return new EvaluationDecisionResult({
      decision,
      ruleVersion: input.rule.version,
      basis: `Decision derived from criterion status '${input.criterionEvaluationStatus}' using explicit rule '${input.rule.version}'`,
    });
  }
}
