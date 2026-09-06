import { describe, expect, it } from 'vitest';

type RiskCase = {
  readonly id: string;
  readonly impact: number;
  readonly probability: number;
  readonly exposure: number;
  readonly uncertainty: number;
};

const candidateRiskScore = ({ impact, probability, exposure }: RiskCase): number =>
  impact * probability * exposure;

const candidateOrdering = (cases: readonly RiskCase[]): readonly RiskCase[] =>
  [...cases].sort((left, right) => {
    const scoreDelta = candidateRiskScore(right) - candidateRiskScore(left);
    if (scoreDelta !== 0) return scoreDelta;
    return right.uncertainty - left.uncertainty;
  });

describe('F2 risk prioritization methodological validation', () => {
  it('orders higher candidate risk before lower candidate risk', () => {
    const cases: RiskCase[] = [
      { id: 'low', impact: 2, probability: 2, exposure: 2, uncertainty: 5 },
      { id: 'high', impact: 5, probability: 4, exposure: 3, uncertainty: 1 },
      { id: 'medium', impact: 3, probability: 3, exposure: 2, uncertainty: 2 },
    ];

    expect(candidateOrdering(cases).map(({ id }) => id)).toEqual(['high', 'medium', 'low']);
  });

  it('uses uncertainty only as a secondary ordering signal when candidate scores tie', () => {
    const cases: RiskCase[] = [
      { id: 'known', impact: 5, probability: 5, exposure: 1, uncertainty: 1 },
      { id: 'uncertain', impact: 1, probability: 5, exposure: 5, uncertainty: 5 },
    ];

    const known = cases[0];
    const uncertain = cases[1];
    if (!known || !uncertain) throw new Error('Risk validation cases are incomplete');

    expect(candidateRiskScore(known)).toBe(candidateRiskScore(uncertain));
    expect(candidateOrdering(cases).map(({ id }) => id)).toEqual(['uncertain', 'known']);
  });

  it('shows that multiplicative risk can produce tied scores from different factor profiles', () => {
    const first: RiskCase = { id: 'a', impact: 5, probability: 5, exposure: 2, uncertainty: 1 };
    const second: RiskCase = { id: 'b', impact: 5, probability: 2, exposure: 5, uncertainty: 1 };

    expect(candidateRiskScore(first)).toBe(50);
    expect(candidateRiskScore(second)).toBe(50);
    expect(first.impact).not.toBe(second.probability);
  });

  it('does not change candidate risk score when only uncertainty changes', () => {
    const known: RiskCase = { id: 'known', impact: 4, probability: 3, exposure: 2, uncertainty: 1 };
    const uncertain: RiskCase = { ...known, id: 'uncertain', uncertainty: 5 };

    expect(candidateRiskScore(known)).toBe(24);
    expect(candidateRiskScore(uncertain)).toBe(24);
  });

  it('preserves the factor values required for an auditable prioritization record', () => {
    const riskCase: RiskCase = {
      id: 'audit-01',
      impact: 4,
      probability: 3,
      exposure: 5,
      uncertainty: 2,
    };

    expect(Object.keys(riskCase).sort()).toEqual([
      'exposure',
      'id',
      'impact',
      'probability',
      'uncertainty',
    ]);
    expect(candidateRiskScore(riskCase)).toBe(60);
  });
});
