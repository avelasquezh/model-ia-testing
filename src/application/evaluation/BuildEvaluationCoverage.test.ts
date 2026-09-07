import { describe, expect, it } from 'vitest';
import { CriterionEvaluation } from '../../domain/evaluation/CriterionEvaluation.js';
import { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { BuildEvaluationCoverage } from './BuildEvaluationCoverage.js';

const plan = new EvaluationPlan({
  executionId: 'exec-35',
  context: 'WHATSAPP',
  scope: 'MVP_CORE',
  items: [
    {
      criterionId: 'C1',
      dimensionId: 'D1',
      type: 'BOOLEAN',
      applicability: 'APPLICABLE',
      reason: 'functional criterion applies',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'rule-v1',
    },
    {
      criterionId: 'C2',
      dimensionId: 'D2',
      type: 'BOOLEAN',
      applicability: 'APPLICABLE',
      reason: 'conversation criterion applies',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'rule-v1',
    },
    {
      criterionId: 'C3',
      dimensionId: 'D6',
      type: 'BOOLEAN',
      applicability: 'APPLICABLE',
      reason: 'timing criterion applies',
      requiredEvidence: ['TIMING'],
      ruleVersion: 'rule-v1',
    },
    {
      criterionId: 'C4',
      dimensionId: 'D7',
      type: 'BOOLEAN',
      applicability: 'NOT_APPLICABLE',
      reason: 'channel interaction is not part of this execution',
      requiredEvidence: ['INTERACTION'],
      ruleVersion: 'rule-v1',
    },
    {
      criterionId: 'C5',
      dimensionId: 'D1',
      type: 'BOOLEAN',
      applicability: 'APPLICABLE',
      reason: 'evidence was expected',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'rule-v1',
    },
  ],
  selectionContext: {
    scenarioId: 'scenario-35',
    scenarioVersion: 1,
    executionContext: 'WHATSAPP',
    scope: 'MVP_CORE',
    selectedCriterionIds: ['C1', 'C2', 'C3', 'C4', 'C5'],
  },
});

const evaluation = (criterionId: string, status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE') =>
  new CriterionEvaluation({
    criterionId,
    executionId: 'exec-35',
    evidenceId: `evidence-${criterionId}`,
    status,
    rule: 'rule-v1',
    reason: `evaluation for ${criterionId}`,
    evaluatedAt: new Date('2026-09-07T12:00:00Z'),
  });

describe('BuildEvaluationCoverage', () => {
  const builder = new BuildEvaluationCoverage();

  it('separates applicable evaluated, not evaluated, not applicable, insufficient evidence and inconclusive', () => {
    const result = builder.build({
      plan,
      evaluations: [evaluation('C1', 'PASS'), evaluation('C2', 'NOT_EVALUABLE'), evaluation('C3', 'INCONCLUSIVE')],
    });

    expect(result.props.entries).toEqual([
      { criterionId: 'C1', status: 'APPLICABLE_EVALUATED', evaluationStatus: 'PASS' },
      { criterionId: 'C2', status: 'INSUFFICIENT_EVIDENCE', evaluationStatus: 'NOT_EVALUABLE' },
      { criterionId: 'C3', status: 'INCONCLUSIVE', evaluationStatus: 'INCONCLUSIVE' },
      { criterionId: 'C4', status: 'NOT_APPLICABLE' },
      { criterionId: 'C5', status: 'APPLICABLE_NOT_EVALUATED' },
    ]);

    expect(result.count('APPLICABLE_EVALUATED')).toBe(1);
    expect(result.count('INSUFFICIENT_EVIDENCE')).toBe(1);
    expect(result.count('INCONCLUSIVE')).toBe(1);
    expect(result.count('NOT_APPLICABLE')).toBe(1);
    expect(result.count('APPLICABLE_NOT_EVALUATED')).toBe(1);
  });

  it('rejects evaluations outside the selected plan', () => {
    expect(() => builder.build({ plan, evaluations: [evaluation('C99', 'PASS')] })).toThrow(
      'outside evaluation plan selection: C99',
    );
  });

  it('rejects duplicate evaluations for one criterion', () => {
    expect(() => builder.build({ plan, evaluations: [evaluation('C1', 'PASS'), evaluation('C1', 'FAIL')] })).toThrow(
      'Duplicate criterion evaluation: C1',
    );
  });

  it('rejects an evaluation for NOT_APPLICABLE', () => {
    expect(() => builder.build({ plan, evaluations: [evaluation('C4', 'PASS')] })).toThrow(
      'NOT_APPLICABLE criterion: C4',
    );
  });
});
