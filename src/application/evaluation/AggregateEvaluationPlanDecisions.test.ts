import { describe, expect, it } from 'vitest';
import { EvaluationDecisionResult } from '../../domain/evaluation/EvaluationDecision.js';
import { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { AggregateEvaluationPlanDecisions } from './AggregateEvaluationPlanDecisions.js';

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
      reason: 'selected',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'criterion-rule-v1',
    },
    {
      criterionId: 'C2',
      dimensionId: 'D2',
      type: 'BOOLEAN',
      applicability: 'APPLICABLE',
      reason: 'selected',
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

describe('AggregateEvaluationPlanDecisions', () => {
  const aggregator = new AggregateEvaluationPlanDecisions();

  it('aggregates exactly the criteria selected by the evaluation plan', () => {
    const result = aggregator.aggregate({
      plan,
      decisions: [
        { criterionId: 'C1', decision: decision('ACCEPTED') },
        { criterionId: 'C2', decision: decision('ACCEPTED') },
      ],
    });

    expect(result.props.outcome).toBe('ACCEPTED');
    expect(result.props.evaluatedCriterionIds).toEqual(['C1', 'C2']);
  });

  it('rejects a decision for a criterion outside the plan selection', () => {
    expect(() =>
      aggregator.aggregate({
        plan,
        decisions: [
          { criterionId: 'C1', decision: decision('ACCEPTED') },
          { criterionId: 'C3', decision: decision('ACCEPTED') },
        ],
      }),
    ).toThrow('outside evaluation plan selection');
  });

  it('rejects when a selected criterion has no decision', () => {
    expect(() =>
      aggregator.aggregate({
        plan,
        decisions: [{ criterionId: 'C1', decision: decision('ACCEPTED') }],
      }),
    ).toThrow('exactly the selected criteria');
  });

  it('rejects duplicate decisions through the underlying aggregation contract', () => {
    expect(() =>
      aggregator.aggregate({
        plan,
        decisions: [
          { criterionId: 'C1', decision: decision('ACCEPTED') },
          { criterionId: 'C1', decision: decision('ACCEPTED') },
        ],
      }),
    ).toThrow('exactly the selected criteria');
  });
});
