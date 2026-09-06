import { describe, expect, it } from 'vitest';

type Outcome = 'PASS' | 'PARTIAL' | 'FAIL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE';

type Repetition = {
  readonly executionId: string;
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly outcome: Outcome;
  readonly conditionFingerprint: string;
};

const validateRepetitionSet = (repetitions: readonly Repetition[]): boolean =>
  repetitions.length > 0 &&
  repetitions.every(
    (item) =>
      item.executionId.trim().length > 0 &&
      item.scenarioId.trim().length > 0 &&
      Number.isInteger(item.scenarioVersion) &&
      item.scenarioVersion > 0 &&
      item.conditionFingerprint.trim().length > 0,
  );

const outcomeDistribution = (repetitions: readonly Repetition[]): Record<Outcome, number> =>
  repetitions.reduce<Record<Outcome, number>>(
    (counts, repetition) => ({
      ...counts,
      [repetition.outcome]: counts[repetition.outcome] + 1,
    }),
    { PASS: 0, PARTIAL: 0, FAIL: 0, INCONCLUSIVE: 0, NOT_EVALUABLE: 0 },
  );

const hasComparableConditions = (repetitions: readonly Repetition[]): boolean => {
  const fingerprints = new Set(repetitions.map((item) => item.conditionFingerprint));
  return fingerprints.size === 1;
};

describe('F2 repetition and reproducibility methodological validation', () => {
  const repetitions: Repetition[] = [
    { executionId: 'run-1', scenarioId: 'scenario-1', scenarioVersion: 2, outcome: 'PASS', conditionFingerprint: 'cond-A' },
    { executionId: 'run-2', scenarioId: 'scenario-1', scenarioVersion: 2, outcome: 'PASS', conditionFingerprint: 'cond-A' },
    { executionId: 'run-3', scenarioId: 'scenario-1', scenarioVersion: 2, outcome: 'FAIL', conditionFingerprint: 'cond-A' },
  ];

  it('requires every repetition to keep an independent execution identity and conditions', () => {
    expect(validateRepetitionSet(repetitions)).toBe(true);
    expect(new Set(repetitions.map((item) => item.executionId)).size).toBe(3);
  });

  it('keeps the scenario version fixed when repetitions are intended to be comparable', () => {
    expect(new Set(repetitions.map((item) => item.scenarioVersion)).size).toBe(1);
    expect(repetitions.every((item) => item.scenarioVersion === 2)).toBe(true);
  });

  it('requires comparable execution conditions before interpreting variability', () => {
    expect(hasComparableConditions(repetitions)).toBe(true);
    expect(
      hasComparableConditions([
        ...repetitions,
        { executionId: 'run-4', scenarioId: 'scenario-1', scenarioVersion: 2, outcome: 'PASS', conditionFingerprint: 'cond-B' },
      ]),
    ).toBe(false);
  });

  it('preserves the individual outcomes instead of collapsing repetitions into one result', () => {
    expect(repetitions.map((item) => item.outcome)).toEqual(['PASS', 'PASS', 'FAIL']);
    expect(outcomeDistribution(repetitions)).toEqual({
      PASS: 2,
      PARTIAL: 0,
      FAIL: 1,
      INCONCLUSIVE: 0,
      NOT_EVALUABLE: 0,
    });
  });

  it('exposes variability without defining an acceptance threshold', () => {
    const distribution = outcomeDistribution(repetitions);
    expect(distribution.PASS).toBe(2);
    expect(distribution.FAIL).toBe(1);
  });

  it('does not convert INCONCLUSIVE or NOT_EVALUABLE repetitions into failures', () => {
    const distribution = outcomeDistribution([
      { executionId: 'run-4', scenarioId: 'scenario-1', scenarioVersion: 2, outcome: 'INCONCLUSIVE', conditionFingerprint: 'cond-A' },
      { executionId: 'run-5', scenarioId: 'scenario-1', scenarioVersion: 2, outcome: 'NOT_EVALUABLE', conditionFingerprint: 'cond-A' },
    ]);

    expect(distribution.FAIL).toBe(0);
    expect(distribution.INCONCLUSIVE).toBe(1);
    expect(distribution.NOT_EVALUABLE).toBe(1);
  });
});
