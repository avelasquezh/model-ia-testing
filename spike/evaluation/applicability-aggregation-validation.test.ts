import { describe, expect, it } from 'vitest';
import { EvaluationDecisionResult } from '../../src/domain/evaluation/EvaluationDecision.js';
import { EvaluationPlan } from '../../src/domain/evaluation/EvaluationPlan.js';
import { AggregateApplicableEvaluationPlanDecisions } from '../../src/application/evaluation/AggregateApplicableEvaluationPlanDecisions.js';

const makeDecision = (decision: 'ACCEPTED' | 'REJECTED' | 'UNDECIDED') =>
  new EvaluationDecisionResult({
    decision,
    ruleVersion: 'rule-v1',
    basis: `spike decision ${decision}`,
  });

const makePlan = (allNotApplicable = false) => new EvaluationPlan({
  executionId: 'spike-exec-1',
  context: 'WHATSAPP',
  scope: 'MVP_CORE',
  items: [
    {
      criterionId: 'C1',
      dimensionId: 'D1',
      type: 'BOOLEAN',
      applicability: allNotApplicable ? 'NOT_APPLICABLE' : 'APPLICABLE',
      reason: 'controlled spike criterion',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'criterion-rule-v1',
    },
    {
      criterionId: 'C2',
      dimensionId: 'D2',
      type: 'BOOLEAN',
      applicability: 'NOT_APPLICABLE',
      reason: 'outside the tested capability scope',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'criterion-rule-v1',
    },
  ],
  selectionContext: {
    scenarioId: 'spike-scenario-1',
    scenarioVersion: 1,
    executionContext: 'WHATSAPP',
    scope: 'MVP_CORE',
    selectedCriterionIds: ['C1', 'C2'],
  },
});

describe('F2-34 applicability-aware decision aggregation', () => {
  const aggregator = new AggregateApplicableEvaluationPlanDecisions();

  it('excludes NOT_APPLICABLE criteria from the decision aggregate', () => {
    const result = aggregator.aggregate({
      plan: makePlan(),
      decisions: [{ criterionId: 'C1', decision: makeDecision('ACCEPTED') }],
    });

    expect(result.aggregation?.props.outcome).toBe('ACCEPTED');
    expect(result.aggregation?.props.evaluatedCriterionIds).toEqual(['C1']);
    expect(result.notApplicableCriterionIds).toEqual(['C2']);
  });

  it('keeps an all-NOT_APPLICABLE plan distinct from an accepted decision', () => {
    const result = aggregator.aggregate({
      plan: makePlan(true),
      decisions: [],
    });

    expect(result.aggregation).toBeNull();
    expect(result.applicableCriterionIds).toEqual([]);
    expect(result.notApplicableCriterionIds).toEqual(['C1', 'C2']);
  });
});
