import { describe, expect, it } from 'vitest';
import { EvaluationComparability } from './EvaluationComparability.js';

describe('EvaluationComparability', () => {
  it('accepts a comparable result without reasons', () => {
    const result = new EvaluationComparability({
      leftExecutionId: 'exec-1',
      rightExecutionId: 'exec-2',
      status: 'COMPARABLE',
      reasons: [],
      basis: 'same methodological context and conditions',
    });

    expect(result.props.status).toBe('COMPARABLE');
  });

  it('rejects comparable results with reasons', () => {
    expect(() => new EvaluationComparability({
      leftExecutionId: 'exec-1',
      rightExecutionId: 'exec-2',
      status: 'COMPARABLE',
      reasons: ['SCENARIO_VERSION_MISMATCH'],
      basis: 'invalid state',
    })).toThrow('COMPARABLE evaluation cannot contain incompatibility reasons');
  });

  it('requires a concrete incompatibility for NON_COMPARABLE', () => {
    expect(() => new EvaluationComparability({
      leftExecutionId: 'exec-1',
      rightExecutionId: 'exec-2',
      status: 'NON_COMPARABLE',
      reasons: ['MISSING_CONDITION_FINGERPRINT'],
      basis: 'invalid state',
    })).toThrow('NON_COMPARABLE evaluation requires a concrete incompatibility reason');
  });

  it('distinguishes evidence insufficiency from true incompatibility', () => {
    expect(() => new EvaluationComparability({
      leftExecutionId: 'exec-1',
      rightExecutionId: 'exec-2',
      status: 'INSUFFICIENT_EVIDENCE',
      reasons: ['MISSING_CONDITION_FINGERPRINT'],
      basis: 'condition identity is absent',
    })).not.toThrow();

    expect(() => new EvaluationComparability({
      leftExecutionId: 'exec-1',
      rightExecutionId: 'exec-2',
      status: 'INSUFFICIENT_EVIDENCE',
      reasons: ['MISSING_CONDITION_FINGERPRINT', 'SCENARIO_VERSION_MISMATCH'],
      basis: 'mixed state',
    })).toThrow('INSUFFICIENT_EVIDENCE cannot coexist with a concrete incompatibility');
  });
});
