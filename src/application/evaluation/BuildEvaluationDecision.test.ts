import { describe, expect, it } from 'vitest';
import { BuildEvaluationDecision } from './BuildEvaluationDecision.js';

describe('BuildEvaluationDecision', () => {
  const builder = new BuildEvaluationDecision();

  it('uses the explicit rule to accept a criterion result', () => {
    const result = builder.build({
      criterionEvaluationStatus: 'PASS',
      rule: {
        version: 'criterion-rule-v1',
        decide: (status) => (status === 'PASS' ? 'ACCEPTED' : 'UNDECIDED'),
      },
    });

    expect(result.props).toEqual({
      decision: 'ACCEPTED',
      ruleVersion: 'criterion-rule-v1',
      basis: expect.stringContaining("using explicit rule 'criterion-rule-v1'"),
    });
  });

  it('uses the explicit rule to reject a criterion result', () => {
    const result = builder.build({
      criterionEvaluationStatus: 'FAIL',
      rule: {
        version: 'criterion-rule-v2',
        decide: (status) => (status === 'FAIL' ? 'REJECTED' : 'UNDECIDED'),
      },
    });

    expect(result.props.decision).toBe('REJECTED');
  });

  it('preserves an undecided result from the explicit rule', () => {
    const result = builder.build({
      criterionEvaluationStatus: 'NOT_EVALUABLE',
      rule: {
        version: 'criterion-rule-v1',
        decide: () => 'UNDECIDED',
      },
    });

    expect(result.props.decision).toBe('UNDECIDED');
  });

  it('does not provide a default acceptance rule', () => {
    const result = builder.build({
      criterionEvaluationStatus: 'PASS',
      rule: {
        version: 'criterion-rule-conservative',
        decide: () => 'UNDECIDED',
      },
    });

    expect(result.props.decision).toBe('UNDECIDED');
  });

  it('requires a versioned explicit rule', () => {
    expect(() =>
      builder.build({
        criterionEvaluationStatus: 'PASS',
        rule: {
          version: '   ',
          decide: () => 'UNDECIDED',
        },
      }),
    ).toThrow('Evaluation decision rule version is required');
  });
});
