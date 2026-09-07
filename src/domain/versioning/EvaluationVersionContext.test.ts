import { describe, expect, it } from 'vitest';
import { EvaluationVersionContext } from './EvaluationVersionContext.js';

describe('EvaluationVersionContext', () => {
  const valid = {
    productVersion: '0.1.0',
    evaluationMethodVersion: 'f2-method-0.1',
    criterionCatalogVersion: 'f2-criteria-0.1',
    decisionRulesVersion: 'f2-rules-0.1',
  } as const;

  it('accepts the mandatory version references', () => {
    const context = new EvaluationVersionContext(valid);

    expect(context.props).toEqual(valid);
  });

  it('accepts an optional AI evaluator version and commit provenance', () => {
    const context = new EvaluationVersionContext({
      ...valid,
      evaluatorVersion: 'evaluator-openai-1',
      commitSha: 'abc123',
    });

    expect(context.props.evaluatorVersion).toBe('evaluator-openai-1');
    expect(context.props.commitSha).toBe('abc123');
  });

  it('rejects missing or blank mandatory versions', () => {
    expect(
      () => new EvaluationVersionContext({ ...valid, productVersion: '   ' }),
    ).toThrow('productVersion is required');
  });

  it('rejects blank optional provenance fields when supplied', () => {
    expect(
      () => new EvaluationVersionContext({ ...valid, evaluatorVersion: ' ' }),
    ).toThrow('evaluatorVersion must not be empty when provided');

    expect(
      () => new EvaluationVersionContext({ ...valid, commitSha: ' ' }),
    ).toThrow('commitSha must not be empty when provided');
  });

  it('does not expose a mutable version context object', () => {
    const context = new EvaluationVersionContext(valid);

    expect(Object.isFrozen(context.props)).toBe(true);
  });
});
