import { describe, expect, it } from 'vitest';
import { EvaluationPlan } from '../../domain/evaluation/EvaluationPlan.js';
import { EvaluationVersionContext } from '../../domain/versioning/EvaluationVersionContext.js';
import { Execution } from '../../domain/execution/Execution.js';
import { AssessEvaluationComparability } from './AssessEvaluationComparability.js';

const versionContext = (overrides: Partial<EvaluationVersionContext['props']> = {}) =>
  new EvaluationVersionContext({
    productVersion: '0.1.0',
    evaluationMethodVersion: 'f2-method-0.1',
    criterionCatalogVersion: 'f2-criteria-0.1',
    decisionRulesVersion: 'f2-rules-0.1',
    evaluatorVersion: 'evaluator-1',
    commitSha: 'commit-a',
    ...overrides,
  });

const defaultItems: EvaluationPlan['props']['items'] = [
  {
    criterionId: 'C1',
    dimensionId: 'D1',
    type: 'BOOLEAN',
    applicability: 'APPLICABLE',
    reason: 'core behavior',
    requiredEvidence: ['TRANSCRIPT'],
    ruleVersion: 'rule-1',
  },
  {
    criterionId: 'C2',
    dimensionId: 'D2',
    type: 'BOOLEAN',
    applicability: 'NOT_APPLICABLE',
    reason: 'channel-specific',
    requiredEvidence: ['TRANSCRIPT'],
    ruleVersion: 'rule-1',
  },
];

const plan = (
  executionId: string,
  overrides: {
    context?: string;
    scope?: EvaluationPlan['props']['scope'];
    items?: EvaluationPlan['props']['items'];
  } = {},
) => {
  const context = overrides.context ?? 'chatbot-web';
  const scope = overrides.scope ?? 'MVP_CORE';
  const items = overrides.items ?? defaultItems;
  return new EvaluationPlan({
    executionId,
    context,
    scope,
    items,
    selectionContext: {
      scenarioId: 'scenario-1',
      scenarioVersion: 2,
      executionContext: context,
      scope,
      selectedCriterionIds: items.map((item) => item.criterionId),
    },
  });
};

const execution = (
  id: string,
  overrides: {
    scenarioId?: string;
    scenarioVersion?: number;
    productVersion?: string;
    evaluationMethodVersion?: string;
    conditionFingerprint?: string;
    omitConditionFingerprint?: boolean;
    evaluationPlan?: EvaluationPlan;
  } = {},
) => new Execution({
  id,
  scenarioId: overrides.scenarioId ?? 'scenario-1',
  scenarioVersion: overrides.scenarioVersion ?? 2,
  targetId: `target-${id}`,
  targetUrl: 'https://example.com',
  status: 'PASSED',
  versionContext: versionContext({
    productVersion: overrides.productVersion ?? '0.1.0',
    evaluationMethodVersion: overrides.evaluationMethodVersion ?? 'f2-method-0.1',
  }),
  evaluationPlan: overrides.evaluationPlan ?? plan(id),
  ...(overrides.omitConditionFingerprint ? {} : {
    conditionFingerprint: overrides.conditionFingerprint ?? 'cond-A',
  }),
});

describe('AssessEvaluationComparability', () => {
  const assess = new AssessEvaluationComparability();

  it('marks executions comparable when methodological and condition context match', () => {
    const result = assess.assess({ left: execution('exec-1'), right: execution('exec-2') });
    expect(result.props.status).toBe('COMPARABLE');
    expect(result.props.reasons).toEqual([]);
  });

  it('allows product version to differ because it is an explicit comparison dimension', () => {
    const result = assess.assess({
      left: execution('exec-1', { productVersion: '0.1.0' }),
      right: execution('exec-2', { productVersion: '0.2.0' }),
    });
    expect(result.props.status).toBe('COMPARABLE');
  });

  it('rejects different scenario identity or methodological version', () => {
    const result = assess.assess({
      left: execution('exec-1'),
      right: execution('exec-2', {
        scenarioId: 'scenario-2',
        evaluationMethodVersion: 'f2-method-0.2',
      }),
    });
    expect(result.props.status).toBe('NON_COMPARABLE');
    expect(result.props.reasons).toContain('SCENARIO_ID_MISMATCH');
    expect(result.props.reasons).toContain('EVALUATION_METHOD_VERSION_MISMATCH');
  });

  it('rejects different selected criteria or applicability', () => {
    const changedPlan = plan('exec-2', {
      items: [
        {
          criterionId: 'C1',
          dimensionId: 'D1',
          type: 'BOOLEAN',
          applicability: 'NOT_APPLICABLE',
          reason: 'changed applicability',
          requiredEvidence: ['TRANSCRIPT'],
          ruleVersion: 'rule-1',
        },
        {
          criterionId: 'C3',
          dimensionId: 'D3',
          type: 'BOOLEAN',
          applicability: 'APPLICABLE',
          reason: 'different selection',
          requiredEvidence: ['TRANSCRIPT'],
          ruleVersion: 'rule-1',
        },
      ],
    });
    const result = assess.assess({
      left: execution('exec-1'),
      right: execution('exec-2', { evaluationPlan: changedPlan }),
    });
    expect(result.props.status).toBe('NON_COMPARABLE');
    expect(result.props.reasons).toContain('SELECTED_CRITERIA_MISMATCH');
    expect(result.props.reasons).toContain('APPLICABILITY_MISMATCH');
  });

  it('returns insufficient evidence when condition fingerprint is missing', () => {
    const result = assess.assess({
      left: execution('exec-1', { omitConditionFingerprint: true }),
      right: execution('exec-2'),
    });
    expect(result.props.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.props.reasons).toContain('MISSING_CONDITION_FINGERPRINT');
  });

  it('returns insufficient evidence for legacy methodology context', () => {
    const result = assess.assess({
      left: execution('exec-1', { evaluationMethodVersion: 'legacy-unknown' }),
      right: execution('exec-2'),
    });
    expect(result.props.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.props.reasons).toContain('LEGACY_VERSION_CONTEXT');
  });
});
