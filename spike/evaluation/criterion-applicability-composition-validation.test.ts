import { describe, expect, it } from 'vitest';

type DimensionId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7';
type CriterionType = 'BOOLEAN' | 'ORDINAL' | 'NUMERIC' | 'COMPARATIVE';

type CriterionDefinition = {
  readonly id: string;
  readonly dimensionId: DimensionId;
  readonly type: CriterionType;
  readonly applicableContexts: readonly string[];
  readonly requiredEvidence: readonly string[];
};

type CriterionApplicability = {
  readonly criterionId: string;
  readonly applicable: boolean;
  readonly reason: string;
};

const composeApplicableCriteria = (
  criteria: readonly CriterionDefinition[],
  context: string,
): CriterionApplicability[] =>
  criteria.map((criterion) => ({
    criterionId: criterion.id,
    applicable: criterion.applicableContexts.includes(context),
    reason: criterion.applicableContexts.includes(context)
      ? 'Criterion applies to the execution context.'
      : 'Criterion does not apply to the execution context.',
  }));

describe('F2-17 criterion applicability and dimension composition validation', () => {
  const criteria: readonly CriterionDefinition[] = [
    {
      id: 'D1-C01',
      dimensionId: 'D1',
      type: 'BOOLEAN',
      applicableContexts: ['web-chatbot'],
      requiredEvidence: ['TRANSCRIPT'],
    },
    {
      id: 'D6-C01',
      dimensionId: 'D6',
      type: 'NUMERIC',
      applicableContexts: ['web-chatbot'],
      requiredEvidence: ['TIMING'],
    },
    {
      id: 'D7-C02',
      dimensionId: 'D7',
      type: 'BOOLEAN',
      applicableContexts: ['web-chatbot'],
      requiredEvidence: ['INTERACTION', 'DOM'],
    },
    {
      id: 'D6-C05',
      dimensionId: 'D6',
      type: 'NUMERIC',
      applicableContexts: ['load-test'],
      requiredEvidence: ['TIMING'],
    },
  ];

  it('keeps criterion identity, dimension and type explicit', () => {
    for (const criterion of criteria) {
      expect(criterion.id).toBeTruthy();
      expect(criterion.dimensionId).toMatch(/^D[1-7]$/);
      expect(['BOOLEAN', 'ORDINAL', 'NUMERIC', 'COMPARATIVE']).toContain(criterion.type);
    }
  });

  it('selects criteria by explicit execution context instead of assuming every criterion applies', () => {
    const result = composeApplicableCriteria(criteria, 'web-chatbot');
    expect(result.find((item) => item.criterionId === 'D1-C01')?.applicable).toBe(true);
    expect(result.find((item) => item.criterionId === 'D6-C05')?.applicable).toBe(false);
  });

  it('preserves NOT_APPLICABLE semantics independently from evaluation outcome', () => {
    const result = composeApplicableCriteria(criteria, 'web-chatbot');
    const loadCriterion = result.find((item) => item.criterionId === 'D6-C05');

    expect(loadCriterion?.applicable).toBe(false);
    expect(loadCriterion?.reason).toContain('does not apply');
  });

  it('allows multiple applicable criteria from the same dimension without collapsing them', () => {
    const result = composeApplicableCriteria(criteria, 'web-chatbot');
    const applicableD6 = result.filter(
      (item) => item.applicable && criteria.find((criterion) => criterion.id === item.criterionId)?.dimensionId === 'D6',
    );

    expect(applicableD6.map((item) => item.criterionId)).toEqual(['D6-C01']);
  });

  it('requires each criterion to declare the evidence types needed for evaluation', () => {
    for (const criterion of criteria) {
      expect(criterion.requiredEvidence.length).toBeGreaterThan(0);
    }
  });

  it('does not turn criterion applicability into a global quality score or dimension weight', () => {
    const result = composeApplicableCriteria(criteria, 'web-chatbot');
    expect(result[0]).not.toHaveProperty('score');
    expect(result[0]).not.toHaveProperty('weight');
    expect(result[0]).not.toHaveProperty('globalScore');
  });
});
