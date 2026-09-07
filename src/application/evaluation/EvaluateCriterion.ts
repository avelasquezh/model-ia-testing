import { CriterionEvaluation } from '../../domain/evaluation/CriterionEvaluation.js';
import type { CriterionEvaluationStatus } from '../../domain/evaluation/CriterionEvaluation.js';
import type { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import type { EvaluationEvidence, EvidenceCatalog } from '../ports/EvidenceCatalog.js';

export type CriterionDecision = {
  readonly status: CriterionEvaluationStatus;
  readonly reason: string;
};

export interface CriterionDecisionRule {
  readonly version: string;
  decide(input: {
    readonly criterionId: string;
    readonly evidence: readonly EvaluationEvidence[];
  }): CriterionDecision;
}

export type EvaluateCriterionInput = {
  readonly executionId: string;
  readonly plan: EvaluationPlan;
  readonly criterionId: string;
};

export class EvaluateCriterion {
  public constructor(
    private readonly evidenceCatalog: EvidenceCatalog,
    private readonly rules: ReadonlyMap<string, CriterionDecisionRule>,
  ) {}

  public async evaluate(input: EvaluateCriterionInput): Promise<CriterionEvaluation> {
    if (!input.executionId.trim()) throw new Error('Execution id is required');
    if (input.plan.props.executionId !== input.executionId) {
      throw new Error('Evaluation plan execution id does not match execution');
    }

    const item = input.plan.props.items.find((candidate) => candidate.criterionId === input.criterionId);
    if (!item) throw new Error(`Criterion not found in evaluation plan: ${input.criterionId}`);

    const evidence = await this.evidenceCatalog.findByExecutionId(input.executionId);
    const required = new Set(item.requiredEvidence);
    const available = new Set(evidence.map((candidate) => candidate.evidenceType));
    const missing = [...required].filter((type) => !available.has(type));

    const evidenceId = evidence[0]?.id;
    if (!evidenceId) {
      return this.buildEvaluation(input.executionId, item.criterionId, 'NOT_EVALUABLE', 'No evidence is available for this execution.', item.ruleVersion, 'NOT_EVALUABLE');
    }

    if (missing.length > 0) {
      return this.buildEvaluation(
        input.executionId,
        item.criterionId,
        'INCONCLUSIVE',
        `Required evidence is missing: ${missing.join(', ')}`,
        item.ruleVersion,
        evidenceId,
      );
    }

    const rule = this.rules.get(item.criterionId);
    if (!rule) {
      return this.buildEvaluation(
        input.executionId,
        item.criterionId,
        'NOT_EVALUABLE',
        `No decision rule is registered for criterion ${item.criterionId}`,
        item.ruleVersion,
        evidenceId,
      );
    }

    if (rule.version !== item.ruleVersion) {
      return this.buildEvaluation(
        input.executionId,
        item.criterionId,
        'NOT_EVALUABLE',
        `Decision rule version ${rule.version} does not match criterion rule version ${item.ruleVersion}`,
        item.ruleVersion,
        evidenceId,
      );
    }

    const decision = rule.decide({ criterionId: item.criterionId, evidence });
    return this.buildEvaluation(
      input.executionId,
      item.criterionId,
      decision.status,
      decision.reason,
      rule.version,
      evidenceId,
    );
  }

  private buildEvaluation(
    executionId: string,
    criterionId: string,
    status: CriterionEvaluationStatus,
    reason: string,
    rule: string,
    evidenceId: string,
  ): CriterionEvaluation {
    return new CriterionEvaluation({
      criterionId,
      executionId,
      evidenceId,
      status,
      rule,
      reason,
      evaluatedAt: new Date(),
    });
  }
}
