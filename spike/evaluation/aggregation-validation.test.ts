import { describe, expect, it } from 'vitest';

type ResultStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE';

const complianceValue = (status: ResultStatus): number | null => {
  if (status === 'PASS') return 1;
  if (status === 'PARTIAL') return 0.5;
  if (status === 'FAIL') return 0;
  return null;
};

const aggregateCompliance = (statuses: readonly ResultStatus[]): number | null => {
  const values = statuses.map(complianceValue).filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const countStatuses = (statuses: readonly ResultStatus[]) =>
  statuses.reduce<Record<ResultStatus, number>>(
    (counts, status) => ({ ...counts, [status]: counts[status] + 1 }),
    { PASS: 0, PARTIAL: 0, FAIL: 0, INCONCLUSIVE: 0, NOT_EVALUABLE: 0 },
  );

describe('F2 aggregation methodological validation', () => {
  it('calculates compliance from evaluable results only', () => {
    expect(aggregateCompliance(['PASS', 'FAIL', 'INCONCLUSIVE', 'NOT_EVALUABLE'])).toBe(0.5);
  });

  it('does not treat NOT_EVALUABLE as FAIL', () => {
    expect(aggregateCompliance(['PASS', 'NOT_EVALUABLE'])).toBe(1);
    expect(aggregateCompliance(['PASS', 'FAIL'])).toBe(0.5);
  });

  it('does not treat INCONCLUSIVE as FAIL', () => {
    expect(aggregateCompliance(['PASS', 'INCONCLUSIVE'])).toBe(1);
    expect(aggregateCompliance(['PASS', 'FAIL'])).toBe(0.5);
  });

  it('represents PARTIAL as a candidate 0.5 value without changing the raw state', () => {
    expect(complianceValue('PARTIAL')).toBe(0.5);
    expect(countStatuses(['PARTIAL'])).toEqual({
      PASS: 0,
      PARTIAL: 1,
      FAIL: 0,
      INCONCLUSIVE: 0,
      NOT_EVALUABLE: 0,
    });
  });

  it('returns no compliance value when no criterion is evaluable', () => {
    expect(aggregateCompliance(['INCONCLUSIVE', 'NOT_EVALUABLE'])).toBeNull();
  });

  it('preserves all raw states for auditability', () => {
    const statuses: ResultStatus[] = [
      'PASS',
      'PASS',
      'PARTIAL',
      'FAIL',
      'INCONCLUSIVE',
      'NOT_EVALUABLE',
    ];

    expect(countStatuses(statuses)).toEqual({
      PASS: 2,
      PARTIAL: 1,
      FAIL: 1,
      INCONCLUSIVE: 1,
      NOT_EVALUABLE: 1,
    });
  });

  it('keeps dimension aggregation conceptually independent from global scoring', () => {
    const dimensions = {
      D1: ['PASS', 'PASS'] as ResultStatus[],
      D2: ['FAIL', 'PASS'] as ResultStatus[],
      D3: ['NOT_EVALUABLE'] as ResultStatus[],
    };

    expect(aggregateCompliance(dimensions.D1)).toBe(1);
    expect(aggregateCompliance(dimensions.D2)).toBe(0.5);
    expect(aggregateCompliance(dimensions.D3)).toBeNull();
  });
});
