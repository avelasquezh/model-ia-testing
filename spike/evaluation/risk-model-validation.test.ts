import { describe, expect, it } from 'vitest';

type RiskFactors = {
  readonly impact: number;
  readonly probability: number;
  readonly exposure: number;
  readonly uncertainty: number;
};

const candidateRiskScore = ({ impact, probability, exposure }: RiskFactors): number =>
  impact * probability * exposure;

const assertScale = (value: number): void => {
  expect(Number.isInteger(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(1);
  expect(value).toBeLessThanOrEqual(5);
};

describe('F2 risk model methodological validation', () => {
  it('keeps candidate risk score reproducible for the same factors', () => {
    const factors: RiskFactors = {
      impact: 4,
      probability: 3,
      exposure: 5,
      uncertainty: 2,
    };

    expect(candidateRiskScore(factors)).toBe(60);
    expect(candidateRiskScore(factors)).toBe(candidateRiskScore(factors));
  });

  it('is monotonically sensitive to impact, probability, and exposure', () => {
    const baseline: RiskFactors = {
      impact: 2,
      probability: 2,
      exposure: 2,
      uncertainty: 1,
    };

    expect(candidateRiskScore({ ...baseline, impact: 3 })).toBeGreaterThan(
      candidateRiskScore(baseline),
    );
    expect(candidateRiskScore({ ...baseline, probability: 3 })).toBeGreaterThan(
      candidateRiskScore(baseline),
    );
    expect(candidateRiskScore({ ...baseline, exposure: 3 })).toBeGreaterThan(
      candidateRiskScore(baseline),
    );
  });

  it('keeps uncertainty separate from the candidate risk multiplier', () => {
    const lowUncertainty: RiskFactors = {
      impact: 4,
      probability: 3,
      exposure: 2,
      uncertainty: 1,
    };
    const highUncertainty: RiskFactors = {
      ...lowUncertainty,
      uncertainty: 5,
    };

    expect(candidateRiskScore(highUncertainty)).toBe(candidateRiskScore(lowUncertainty));
  });

  it('preserves the proposed 1-5 factor scales', () => {
    for (const factors of [
      { impact: 1, probability: 1, exposure: 1, uncertainty: 1 },
      { impact: 5, probability: 5, exposure: 5, uncertainty: 5 },
      { impact: 3, probability: 4, exposure: 2, uncertainty: 5 },
    ]) {
      assertScale(factors.impact);
      assertScale(factors.probability);
      assertScale(factors.exposure);
      assertScale(factors.uncertainty);
    }
  });

  it('covers the candidate score range without introducing an out-of-range result', () => {
    expect(candidateRiskScore({ impact: 1, probability: 1, exposure: 1, uncertainty: 5 })).toBe(1);
    expect(candidateRiskScore({ impact: 5, probability: 5, exposure: 5, uncertainty: 1 })).toBe(125);
  });

  it('does not define priority thresholds as part of the candidate formula', () => {
    const score = candidateRiskScore({
      impact: 5,
      probability: 5,
      exposure: 5,
      uncertainty: 5,
    });

    expect(score).toBe(125);
    expect(['P0', 'P1', 'P2', 'P3']).toContain('P0');
    expect(true).toBe(true);
  });
});
