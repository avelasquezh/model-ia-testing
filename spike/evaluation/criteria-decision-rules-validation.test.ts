import { describe, expect, it } from 'vitest';

type ResultStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE';
type EvidenceState = 'SUFFICIENT' | 'INSUFFICIENT' | 'UNAVAILABLE';
type CriterionType = 'BOOLEAN' | 'ORDINAL' | 'NUMERIC' | 'COMPARATIVE';

type DecisionRule = {
  readonly criterionId: string;
  readonly criterionType: CriterionType;
  readonly version: number;
  readonly applicability: 'APPLICABLE' | 'NOT_APPLICABLE';
  readonly requiredEvidence: readonly string[];
  readonly interpretation: string;
  readonly outcomes: readonly ResultStatus[];
};

const decide = (
  rule: DecisionRule,
  evidenceState: EvidenceState,
  interpretedOutcome: ResultStatus | null,
): ResultStatus => {
  if (rule.applicability === 'NOT_APPLICABLE') return 'NOT_EVALUABLE';
  if (evidenceState === 'UNAVAILABLE') return 'NOT_EVALUABLE';
  if (evidenceState === 'INSUFFICIENT') return 'INCONCLUSIVE';
  if (interpretedOutcome === null || !rule.outcomes.includes(interpretedOutcome)) {
    return 'INCONCLUSIVE';
  }
  return interpretedOutcome;
};

describe('F2-16 criterion decision-rule methodological validation', () => {
  const booleanRule: DecisionRule = {
    criterionId: 'D1-C01',
    criterionType: 'BOOLEAN',
    version: 1,
    applicability: 'APPLICABLE',
    requiredEvidence: ['TRANSCRIPT'],
    interpretation: 'PASS when all expected observable outcomes are satisfied; FAIL otherwise.',
    outcomes: ['PASS', 'FAIL', 'INCONCLUSIVE', 'NOT_EVALUABLE'],
  };

  it('requires each decision rule to identify criterion, type, version, evidence and interpretation', () => {
    expect(booleanRule.criterionId).toBeTruthy();
    expect(booleanRule.criterionType).toBe('BOOLEAN');
    expect(booleanRule.version).toBeGreaterThan(0);
    expect(booleanRule.requiredEvidence.length).toBeGreaterThan(0);
    expect(booleanRule.interpretation).toBeTruthy();
  });

  it('evaluates evidence sufficiency before interpreting PASS or FAIL', () => {
    expect(decide(booleanRule, 'SUFFICIENT', 'PASS')).toBe('PASS');
    expect(decide(booleanRule, 'SUFFICIENT', 'FAIL')).toBe('FAIL');
    expect(decide(booleanRule, 'INSUFFICIENT', 'PASS')).toBe('INCONCLUSIVE');
  });

  it('distinguishes unavailable applicability/evidence from insufficient evidence', () => {
    expect(decide(booleanRule, 'UNAVAILABLE', null)).toBe('NOT_EVALUABLE');
    expect(decide(booleanRule, 'INSUFFICIENT', null)).toBe('INCONCLUSIVE');
  });

  it('does not infer a result when the interpreted outcome is outside the rule contract', () => {
    expect(decide(booleanRule, 'SUFFICIENT', 'PARTIAL')).toBe('INCONCLUSIVE');
  });

  it('supports criterion-specific interpretation for numeric metrics without hard-coding a universal threshold', () => {
    const timingRule: DecisionRule = {
      criterionId: 'D6-C01',
      criterionType: 'NUMERIC',
      version: 2,
      applicability: 'APPLICABLE',
      requiredEvidence: ['TIMING'],
      interpretation: 'Compare the observed response time with the threshold configured for this criterion and context.',
      outcomes: ['PASS', 'FAIL', 'INCONCLUSIVE', 'NOT_EVALUABLE'],
    };

    expect(decide(timingRule, 'SUFFICIENT', 'PASS')).toBe('PASS');
    expect(decide(timingRule, 'SUFFICIENT', 'FAIL')).toBe('FAIL');
    expect(timingRule.interpretation).not.toContain('universal');
  });

  it('allows PARTIAL only when the criterion rule explicitly permits a graded interpretation', () => {
    const completenessRule: DecisionRule = {
      criterionId: 'D2-C04',
      criterionType: 'ORDINAL',
      version: 1,
      applicability: 'APPLICABLE',
      requiredEvidence: ['TRANSCRIPT'],
      interpretation: 'PARTIAL is allowed when some expected response elements are satisfied and the rule defines graded completeness.',
      outcomes: ['PASS', 'PARTIAL', 'FAIL', 'INCONCLUSIVE', 'NOT_EVALUABLE'],
    };

    expect(decide(completenessRule, 'SUFFICIENT', 'PARTIAL')).toBe('PARTIAL');
  });

  it('keeps decision rules separate from global scoring and dimension weights', () => {
    expect(booleanRule).not.toHaveProperty('globalScoreWeight');
    expect(booleanRule).not.toHaveProperty('dimensionWeight');
    expect(booleanRule).not.toHaveProperty('globalThreshold');
  });

  it('preserves versioning so a semantic rule change is distinguishable', () => {
    const revisedRule = { ...booleanRule, version: 2 };

    expect(revisedRule.version).not.toBe(booleanRule.version);
    expect(revisedRule.criterionId).toBe(booleanRule.criterionId);
  });
});
