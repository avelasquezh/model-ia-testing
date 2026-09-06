import { describe, expect, it } from 'vitest';

type Outcome = 'PASS' | 'PARTIAL' | 'FAIL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE';

type Repetition = {
  readonly executionId: string;
  readonly outcome: Outcome;
};

type ProportionInterval = {
  readonly successes: number;
  readonly trials: number;
  readonly proportion: number;
  readonly lower: number;
  readonly upper: number;
};

const proportionWithWilsonInterval = (
  successes: number,
  trials: number,
  z = 1.96,
): ProportionInterval => {
  if (!Number.isInteger(successes) || successes < 0) {
    throw new Error('Successes must be a non-negative integer');
  }
  if (!Number.isInteger(trials) || trials <= 0) {
    throw new Error('Trials must be a positive integer');
  }
  if (successes > trials) {
    throw new Error('Successes cannot exceed trials');
  }
  if (!Number.isFinite(z) || z <= 0) {
    throw new Error('Z value must be positive and finite');
  }

  const p = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denominator;
  const margin =
    (z / denominator) *
    Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);

  return {
    successes,
    trials,
    proportion: p,
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
};

const evaluableOutcomes = (repetitions: readonly Repetition[]): Repetition[] =>
  repetitions.filter(
    (item) => item.outcome !== 'INCONCLUSIVE' && item.outcome !== 'NOT_EVALUABLE',
  );

const outcomeRate = (
  repetitions: readonly Repetition[],
  outcome: 'PASS' | 'PARTIAL' | 'FAIL',
): ProportionInterval | null => {
  const evaluable = evaluableOutcomes(repetitions);
  if (evaluable.length === 0) return null;
  return proportionWithWilsonInterval(
    evaluable.filter((item) => item.outcome === outcome).length,
    evaluable.length,
  );
};

describe('F2 statistical treatment of repetition variability', () => {
  const repetitions: Repetition[] = [
    { executionId: 'run-1', outcome: 'PASS' },
    { executionId: 'run-2', outcome: 'PASS' },
    { executionId: 'run-3', outcome: 'FAIL' },
    { executionId: 'run-4', outcome: 'INCONCLUSIVE' },
    { executionId: 'run-5', outcome: 'NOT_EVALUABLE' },
  ];

  it('uses only evaluable repetitions as the denominator for outcome rates', () => {
    const pass = outcomeRate(repetitions, 'PASS');
    expect(pass).not.toBeNull();
    expect(pass?.successes).toBe(2);
    expect(pass?.trials).toBe(3);
    expect(pass?.proportion).toBeCloseTo(2 / 3);
  });

  it('keeps INCONCLUSIVE and NOT_EVALUABLE outside the PASS/FAIL denominator', () => {
    const fail = outcomeRate(repetitions, 'FAIL');
    expect(fail).not.toBeNull();
    expect(fail?.successes).toBe(1);
    expect(fail?.trials).toBe(3);
  });

  it('reports uncertainty instead of presenting an observed rate as an exact population truth', () => {
    const pass = outcomeRate(repetitions, 'PASS');
    expect(pass?.lower).toBeLessThan(pass?.proportion ?? 0);
    expect(pass?.upper).toBeGreaterThan(pass?.proportion ?? 0);
    expect(pass?.lower).toBeGreaterThanOrEqual(0);
    expect(pass?.upper).toBeLessThanOrEqual(1);
  });

  it('does not produce a rate when no repetition is evaluable', () => {
    expect(
      outcomeRate(
        [
          { executionId: 'run-1', outcome: 'INCONCLUSIVE' },
          { executionId: 'run-2', outcome: 'NOT_EVALUABLE' },
        ],
        'FAIL',
      ),
    ).toBeNull();
  });

  it('does not define acceptance thresholds or a global quality score', () => {
    const pass = outcomeRate(repetitions, 'PASS');
    const fail = outcomeRate(repetitions, 'FAIL');

    expect(pass?.proportion).toBeCloseTo(2 / 3);
    expect(fail?.proportion).toBeCloseTo(1 / 3);
    expect(pass?.proportion).not.toBe(1);
    expect(fail?.proportion).not.toBe(0);
  });
});
