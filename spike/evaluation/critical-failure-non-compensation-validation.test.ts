import { describe, expect, it } from 'vitest';

type Criterion = {
  readonly id: string;
  readonly status: 'PASS' | 'PARTIAL' | 'FAIL';
  readonly critical: boolean;
};

const candidateCompliance = (criteria: readonly Criterion[]): number => {
  if (criteria.length === 0) return 0;
  const values = criteria.map((criterion) =>
    criterion.status === 'PASS' ? 1 : criterion.status === 'PARTIAL' ? 0.5 : 0,
  );
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const candidateDimensionStatus = (criteria: readonly Criterion[]): 'PASS' | 'PARTIAL' | 'FAIL' => {
  const hasCriticalFailure = criteria.some(
    (criterion) => criterion.critical && criterion.status === 'FAIL',
  );
  if (hasCriticalFailure) return 'FAIL';
  if (criteria.some((criterion) => criterion.status === 'FAIL')) return 'FAIL';
  if (criteria.some((criterion) => criterion.status === 'PARTIAL')) return 'PARTIAL';
  return 'PASS';
};

describe('F2 critical-failure non-compensation methodological validation', () => {
  it('prevents a critical FAIL from being hidden by high overall compliance', () => {
    const criteria: Criterion[] = [
      { id: 'critical', status: 'FAIL', critical: true },
      { id: 'support-1', status: 'PASS', critical: false },
      { id: 'support-2', status: 'PASS', critical: false },
      { id: 'support-3', status: 'PASS', critical: false },
    ];

    expect(candidateCompliance(criteria)).toBe(0.75);
    expect(candidateDimensionStatus(criteria)).toBe('FAIL');
  });

  it('keeps non-critical FAIL behavior explicit rather than treating it as compensated PASS', () => {
    const criteria: Criterion[] = [
      { id: 'functional', status: 'FAIL', critical: false },
      { id: 'support', status: 'PASS', critical: false },
    ];

    expect(candidateCompliance(criteria)).toBe(0.5);
    expect(candidateDimensionStatus(criteria)).toBe('FAIL');
  });

  it('does not trigger the critical override when the critical criterion passes', () => {
    const criteria: Criterion[] = [
      { id: 'critical', status: 'PASS', critical: true },
      { id: 'support-1', status: 'PASS', critical: false },
      { id: 'support-2', status: 'PARTIAL', critical: false },
    ];

    expect(candidateCompliance(criteria)).toBeCloseTo(0.8333333333);
    expect(candidateDimensionStatus(criteria)).toBe('PARTIAL');
  });

  it('keeps criticality attached to the criterion for auditability', () => {
    const critical: Criterion = { id: 'D5-C02', status: 'FAIL', critical: true };

    expect(critical).toEqual({ id: 'D5-C02', status: 'FAIL', critical: true });
  });
});
