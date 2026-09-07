import { describe, expect, it } from 'vitest';
import { EvaluationPlan } from '../../src/domain/evaluation/EvaluationPlan.js';
import { EvaluationVersionContext } from '../../src/domain/versioning/EvaluationVersionContext.js';
import { Execution } from '../../src/domain/execution/Execution.js';
import { AssessEvaluationComparability } from '../../src/application/evaluation/AssessEvaluationComparability.js';

describe('F2-38 architecture spike: execution comparability', () => {
  const assess = new AssessEvaluationComparability();

  const makePlan = (executionId: string, criterionId = 'C1') => new EvaluationPlan({
    executionId,
    context: 'chatbot-web',
    scope: 'MVP_CORE',
    items: [{
      criterionId,
      dimensionId: 'D1',
      type: 'BOOLEAN',
      applicability: 'APPLICABLE',
      reason: 'core behavior',
      requiredEvidence: ['TRANSCRIPT'],
      ruleVersion: 'rule-1',
    }],
    selectionContext: {
      scenarioId: 'scenario-1',
      scenarioVersion: 2,
      executionContext: 'chatbot-web',
      scope: 'MVP_CORE',
      selectedCriterionIds: [criterionId],
    },
  });

  const makeExecution = (id: string, options: {
    productVersion?: string;
    conditionFingerprint?: string;
    plan?: EvaluationPlan;
  } = {}) => new Execution({
    id,
    scenarioId: 'scenario-1',
    scenarioVersion: 2,
    targetId: `target-${id}`,
    targetUrl: 'https://example.com',
    status: 'PASSED',
    versionContext: new EvaluationVersionContext({
      productVersion: options.productVersion ?? '0.1.0',
      evaluationMethodVersion: 'f2-method-0.1',
      criterionCatalogVersion: 'f2-criteria-0.1',
      decisionRulesVersion: 'f2-rules-0.1',
    }),
    evaluationPlan: options.plan ?? makePlan(id),
    conditionFingerprint: options.conditionFingerprint ?? 'cond-A',
  });

  it('permits comparable coverage contexts across different product versions', () => {
    const result = assess.assess({
      left: makeExecution('exec-a', { productVersion: '0.1.0' }),
      right: makeExecution('exec-b', { productVersion: '0.2.0' }),
    });

    expect(result.props.status).toBe('COMPARABLE');
  });

  it('blocks comparison when conditions differ', () => {
    const result = assess.assess({
      left: makeExecution('exec-a', { conditionFingerprint: 'cond-A' }),
      right: makeExecution('exec-b', { conditionFingerprint: 'cond-B' }),
    });

    expect(result.props.status).toBe('NON_COMPARABLE');
    expect(result.props.reasons).toContain('CONDITION_FINGERPRINT_MISMATCH');
  });

  it('blocks comparison when the selected evaluation scope differs', () => {
    const rightPlan = new EvaluationPlan({
      executionId: 'exec-b',
      context: 'chatbot-web',
      scope: 'CATALOG',
      items: [
        {
          criterionId: 'C1',
          dimensionId: 'D1',
          type: 'BOOLEAN',
          applicability: 'APPLICABLE',
          reason: 'core behavior',
          requiredEvidence: ['TRANSCRIPT'],
          ruleVersion: 'rule-1',
        },
      ],
      selectionContext: {
        scenarioId: 'scenario-1',
        scenarioVersion: 2,
        executionContext: 'chatbot-web',
        scope: 'CATALOG',
        selectedCriterionIds: ['C1'],
      },
    });

    const result = assess.assess({
      left: makeExecution('exec-a'),
      right: makeExecution('exec-b', { plan: rightPlan }),
    });

    expect(result.props.status).toBe('NON_COMPARABLE');
    expect(result.props.reasons).toContain('EVALUATION_SCOPE_MISMATCH');
  });

  it('keeps missing condition provenance as insufficient evidence rather than variability', () => {
    const left = new Execution({
      id: 'exec-a',
      scenarioId: 'scenario-1',
      scenarioVersion: 2,
      targetId: 'target-a',
      targetUrl: 'https://example.com',
      status: 'PASSED',
      versionContext: new EvaluationVersionContext({
        productVersion: '0.1.0',
        evaluationMethodVersion: 'f2-method-0.1',
        criterionCatalogVersion: 'f2-criteria-0.1',
        decisionRulesVersion: 'f2-rules-0.1',
      }),
      evaluationPlan: makePlan('exec-a'),
    });

    const result = assess.assess({ left, right: makeExecution('exec-b') });

    expect(result.props.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.props.reasons).toContain('MISSING_CONDITION_FINGERPRINT');
    expect(result.props.status).not.toBe('NON_COMPARABLE');
  });
});
