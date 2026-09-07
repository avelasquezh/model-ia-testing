import { describe, expect, it } from 'vitest';
import { CriterionEvaluation } from '../../src/domain/evaluation/CriterionEvaluation.js';
import { EvaluationPlan } from '../../src/domain/evaluation/EvaluationPlan.js';
import { BuildEvaluationCoverage } from '../../src/application/evaluation/BuildEvaluationCoverage.js';

const makePlan = () => new EvaluationPlan({
  executionId: 'arch-f2-35',
  context: 'WHATSAPP',
  scope: 'MVP_CORE',
  items: [
    {
      criterionId: 'C1', dimensionId: 'D1', type: 'BOOLEAN', applicability: 'APPLICABLE',
      reason: 'applies', requiredEvidence: ['TRANSCRIPT'], ruleVersion: 'rule-v1',
    },
    {
      criterionId: 'C2', dimensionId: 'D2', type: 'BOOLEAN', applicability: 'APPLICABLE',
      reason: 'applies', requiredEvidence: ['TRANSCRIPT'], ruleVersion: 'rule-v1',
    },
    {
      criterionId: 'C3', dimensionId: 'D7', type: 'BOOLEAN', applicability: 'NOT_APPLICABLE',
      reason: 'outside channel scope', requiredEvidence: ['INTERACTION'], ruleVersion: 'rule-v1',
    },
  ],
  selectionContext: {
    scenarioId: 'arch-scenario-35', scenarioVersion: 1, executionContext: 'WHATSAPP',
    scope: 'MVP_CORE', selectedCriterionIds: ['C1', 'C2', 'C3'],
  },
});

const makeEvaluation = (criterionId: string, status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE') =>
  new CriterionEvaluation({
    criterionId,
    executionId: 'arch-f2-35',
    evidenceId: `e-${criterionId}`,
    status,
    rule: 'rule-v1',
    reason: 'architecture coverage test',
    evaluatedAt: new Date('2026-09-07T12:00:00Z'),
  });

describe('F2-35 architecture coverage boundary', () => {
  it('does not convert NOT_APPLICABLE into an evaluation outcome', () => {
    const result = new BuildEvaluationCoverage().build({
      plan: makePlan(),
      evaluations: [makeEvaluation('C1', 'PASS'), makeEvaluation('C2', 'FAIL')],
    });

    expect(result.count('NOT_APPLICABLE')).toBe(1);
    expect(result.count('APPLICABLE_EVALUATED')).toBe(2);
  });

  it('keeps missing applicable evaluations distinct from insufficient evidence and inconclusive', () => {
    const result = new BuildEvaluationCoverage().build({
      plan: makePlan(),
      evaluations: [makeEvaluation('C1', 'NOT_EVALUABLE')],
    });

    expect(result.props.entries).toEqual([
      { criterionId: 'C1', status: 'INSUFFICIENT_EVIDENCE', evaluationStatus: 'NOT_EVALUABLE' },
      { criterionId: 'C2', status: 'APPLICABLE_NOT_EVALUATED' },
      { criterionId: 'C3', status: 'NOT_APPLICABLE' },
    ]);
  });
});
