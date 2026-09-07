import { describe, expect, it } from 'vitest';
import { EvaluationDecisionResult } from '../../domain/evaluation/EvaluationDecision.js';
import { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { AggregateApplicableEvaluationPlanDecisions } from './AggregateApplicableEvaluationPlanDecisions.js';

const decision = (value: 'ACCEPTED' | 'REJECTED' | 'UNDECIDED') =>
  new EvaluationDecisionResult({
    decision: value,
    ruleVersion: 'rule-v1',
    basis: `criterion decision ${value}`,
  });

const plan = new EvaluationPlan({
  executionId: 'exec-1',
  context: 'WHATSAPP',
  scope: 'MVP_CORE',
  items: [
    {
      criterionId: 'C1',
      dimensionId: 'D1',
      type: 'BOOLEAN',
      applicability: 'APPLICABLE',
      reason: 'selected for WhatsApp evaluation',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'criterion-rule-v1',
    },
    {
      criterionId: 'C2',
      dimensionId: 'D2',
      type: 'BOOLEAN',
      applicability: 'NOT_APPLICABLE',
      reason: 'requires a channel capability not present in this execution',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'criterion-rule-v1',
    },
  ],
  selectionContext: {
    scenarioId: 'scenario-1',
    scenarioVersion: 1,
    executionContext: 'WHATSAPP',
    scope: 'MVP_CORE',
    selectedCriterionIds: ['C1', 'C2'],
  },
});

describe('AggregateApplicableEvaluationPlanDecisions', () => {
  const aggregator = new AggregateApplicableEvaluationPlanDecisions();

  it('aggregates only APPLICABLE criteria and preserves NOT_APPLICABLE traceability', () => {
    const result = aggregator.aggregate({
      plan,
      decisions: [{ criterionId: 'C1', decision: decision('ACCEPTED') }],
    });

    expect(result.aggregation?.props.outcome).toBe('ACCEPTED');
    expect(result.aggregation?.props.evaluatedCriterionIds).toEqual(['C1']);
    expect(result.applicableCriterionIds).toEqual(['C1']);
    expect(result.notApplicableCriterionIds).toEqual(['C2']);
  });

  it('does not allow a decision for a NOT_APPLICABLE criterion', () => {
    expect(() =>
      aggregator.aggregate({
        plan,
        decisions: [
          { criterionId: 'C1', decision: decision('ACCEPTED') },
          { criterionId: 'C2', decision: decision('REJECTED') },
        ],
      }),
    ).toThrow('NOT_APPLICABLE criterion: C2');
  });

  it('requires exactly one decision for each APPLICABLE criterion', () => {
    expect(() =>
      aggregator.aggregate({
        plan,
        decisions: [],
      }),
    ).toThrow('exactly the applicable criteria');
  });

  it('returns no decision aggregation when all selected criteria are NOT_APPLICABLE', () => {
    const allNotApplicablePlan = new EvaluationPlan({
      ...plan.props,
      items: plan.props.items.map((item) => ({
        ...item,
        applicability: 'NOT_APPLICABLE' as const,
      })),
    });

    const result = aggregator.aggregate({
      plan: allNotApplicablePlan,
      decisions: [],
    });

    expect(result.aggregation).toBeNull();
    expect(result.applicableCriterionIds).toEqual([]);
    expect(result.notApplicableCriterionIds).toEqual(['C1', 'C2']);
  });
});
