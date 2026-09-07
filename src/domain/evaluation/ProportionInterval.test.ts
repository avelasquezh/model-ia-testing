import { describe, expect, it } from 'vitest';
import { ProportionInterval } from './ProportionInterval.js';

describe('ProportionInterval', () => {
  it('calculates a Wilson 95% interval for a proportion', () => {
    const interval = ProportionInterval.wilson95(2, 3);
    expect(interval.props.proportion).toBeCloseTo(2 / 3);
    expect(interval.props.lower).toBeGreaterThanOrEqual(0);
    expect(interval.props.upper).toBeLessThanOrEqual(1);
    expect(interval.props.lower).toBeLessThan(interval.props.proportion);
    expect(interval.props.upper).toBeGreaterThan(interval.props.proportion);
  });

  it('supports boundary proportions without leaving [0,1]', () => {
    expect(ProportionInterval.wilson95(0, 3).props.lower).toBe(0);
    expect(ProportionInterval.wilson95(3, 3).props.upper).toBe(1);
  });

  it('rejects invalid counts and z values', () => {
    expect(() => ProportionInterval.wilson95(-1, 3)).toThrow('Successes must be a non-negative integer');
    expect(() => ProportionInterval.wilson95(4, 3)).toThrow('Successes cannot exceed trials');
    expect(() => ProportionInterval.wilson95(1, 0)).toThrow('Trials must be a positive integer');
    expect(() => ProportionInterval.wilson95(1, 3, 0)).toThrow('Z value must be positive and finite');
  });
});
