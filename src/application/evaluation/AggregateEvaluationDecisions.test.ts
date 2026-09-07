import { describe, expect, it } from 'vitest';
import { EvaluationDecisionResult } from '../../domain/evaluation/EvaluationDecision.js';
import { AggregateEvaluationDecisions } from './AggregateEvaluationDecisions.js';

const decision = (value: 'ACCEPTED' | 'REJECTED' | 'UNDECIDED', version = 'rule-v1') =>
  new EvaluationDecisionResult({
    decision: value,
    ruleVersion: version,
    basis: `criterion decision ${value}`,
  });

describe('AggregateEvaluationDecisions', () => {
  const aggregator = new AggregateEvaluationDecisions();

  it('rejects when any criterion is rejected', () => {
    const result = aggregator.aggregate({
      decisions: [
        { criterionId: 'C1', decision: decision('ACCEPTED') },
        { criterionId: 'C2', decision: decision('REJECTED') },
      ],
    });

    expect(result.props.outcome).toBe('REJECTED');
    expect(result.props.rejectedCount).toBe(1);
  });

  it('preserves undecided when there is no rejection', () => {
    const result = aggregator.aggregate({
      decisions: [
        { criterionId: 'C1', decision: decision('ACCEPTED') },
        { criterionId: 'C2', decision: decision('UNDECIDED') },
      ],
    });

    expect(result.props.outcome).toBe('UNDECIDED');
    expect(result.props.undecidedCount).toBe(1);
  });

  it('accepts only when all criteria are accepted', () => {
    const result = aggregator.aggregate({
      decisions: [
        { criterionId: 'C1', decision: decision('ACCEPTED') },
        { criterionId: 'C2', decision: decision('ACCEPTED') },
      ],
    });

    expect(result.props.outcome).toBe('ACCEPTED');
  });

  it('does not treat undecided as rejected', () => {
    const result = aggregator.aggregate({
      decisions: [
        { criterionId: 'C1', decision: decision('UNDECIDED') },
      ],
    });

    expect(result.props.outcome).toBe('UNDECIDED');
    expect(result.props.outcome).not.toBe('REJECTED');
  });

  it('preserves criterion traceability and explicit precedence', () => {
    const result = aggregator.aggregate({
      decisions: [
        { criterionId: 'C1', decision: decision('ACCEPTED') },
        { criterionId: 'C2', decision: decision('REJECTED') },
        { criterionId: 'C3', decision: decision('UNDECIDED') },
      ],
    });

    expect(result.props.evaluatedCriterionIds).toEqual(['C1', 'C2', 'C3']);
    expect(result.props.precedence).toEqual(['REJECTED', 'UNDECIDED', 'ACCEPTED']);
    expect(result.props.basis).toContain('REJECTED > UNDECIDED > ACCEPTED');
  });

  it('rejects duplicate criterion ids', () => {
    expect(() =>
      aggregator.aggregate({
        decisions: [
          { criterionId: 'C1', decision: decision('ACCEPTED') },
          { criterionId: 'C1', decision: decision('ACCEPTED') },
        ],
      }),
    ).toThrow('criterion ids must be unique');
  });

  it('requires at least one criterion', () => {
    expect(() => aggregator.aggregate({ decisions: [] })).toThrow(
      'at least one criterion',
    );
  });
});
