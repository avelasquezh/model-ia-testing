import { describe, expect, it } from 'vitest';

type ReferenceOutcome = 'PASS' | 'FAIL';
type EvaluatorOutcome = ReferenceOutcome | 'INCONCLUSIVE' | 'NOT_EVALUABLE';

type EvaluationCase = {
  readonly id: string;
  readonly reference: ReferenceOutcome;
  readonly evaluated: EvaluatorOutcome;
};

type ClassificationCounts = {
  readonly truePositive: number;
  readonly falsePositive: number;
  readonly falseNegative: number;
  readonly trueNegative: number;
  readonly indeterminate: number;
};

const classify = (cases: readonly EvaluationCase[]): ClassificationCounts => {
  return cases.reduce<ClassificationCounts>(
    (counts, evaluationCase) => {
      if (evaluationCase.evaluated === 'INCONCLUSIVE' || evaluationCase.evaluated === 'NOT_EVALUABLE') {
        return { ...counts, indeterminate: counts.indeterminate + 1 };
      }

      if (evaluationCase.reference === 'FAIL' && evaluationCase.evaluated === 'FAIL') {
        return { ...counts, truePositive: counts.truePositive + 1 };
      }

      if (evaluationCase.reference === 'PASS' && evaluationCase.evaluated === 'FAIL') {
        return { ...counts, falsePositive: counts.falsePositive + 1 };
      }

      if (evaluationCase.reference === 'FAIL' && evaluationCase.evaluated === 'PASS') {
        return { ...counts, falseNegative: counts.falseNegative + 1 };
      }

      return { ...counts, trueNegative: counts.trueNegative + 1 };
    },
    { truePositive: 0, falsePositive: 0, falseNegative: 0, trueNegative: 0, indeterminate: 0 },
  );
};

const precision = (counts: ClassificationCounts): number => {
  const denominator = counts.truePositive + counts.falsePositive;
  return denominator === 0 ? 0 : counts.truePositive / denominator;
};

const recall = (counts: ClassificationCounts): number => {
  const denominator = counts.truePositive + counts.falseNegative;
  return denominator === 0 ? 0 : counts.truePositive / denominator;
};

describe('F2 false-positive and false-negative methodological validation', () => {
  it('distinguishes a false positive from a false negative', () => {
    const cases: EvaluationCase[] = [
      { id: 'fp-1', reference: 'PASS', evaluated: 'FAIL' },
      { id: 'fn-1', reference: 'FAIL', evaluated: 'PASS' },
    ];

    expect(classify(cases)).toEqual({
      truePositive: 0,
      falsePositive: 1,
      falseNegative: 1,
      trueNegative: 0,
      indeterminate: 0,
    });
  });

  it('does not count INCONCLUSIVE as a false negative or false positive', () => {
    const cases: EvaluationCase[] = [
      { id: 'inconclusive', reference: 'FAIL', evaluated: 'INCONCLUSIVE' },
      { id: 'not-evaluable', reference: 'PASS', evaluated: 'NOT_EVALUABLE' },
    ];

    expect(classify(cases)).toEqual({
      truePositive: 0,
      falsePositive: 0,
      falseNegative: 0,
      trueNegative: 0,
      indeterminate: 2,
    });
  });

  it('supports precision and recall as complementary evaluator-quality indicators', () => {
    const cases: EvaluationCase[] = [
      { id: 'tp-1', reference: 'FAIL', evaluated: 'FAIL' },
      { id: 'tp-2', reference: 'FAIL', evaluated: 'FAIL' },
      { id: 'fp-1', reference: 'PASS', evaluated: 'FAIL' },
      { id: 'fn-1', reference: 'FAIL', evaluated: 'PASS' },
      { id: 'tn-1', reference: 'PASS', evaluated: 'PASS' },
    ];

    const counts = classify(cases);

    expect(precision(counts)).toBeCloseTo(2 / 3);
    expect(recall(counts)).toBeCloseTo(2 / 3);
  });

  it('keeps the reference outcome independent from the evaluator outcome', () => {
    const evaluationCase: EvaluationCase = {
      id: 'D2-C02-case-01',
      reference: 'FAIL',
      evaluated: 'PASS',
    };

    expect(evaluationCase.reference).toBe('FAIL');
    expect(evaluationCase.evaluated).toBe('PASS');
  });

  it('preserves case identity so classification errors remain auditable', () => {
    const evaluationCase: EvaluationCase = {
      id: 'D5-C02-case-01',
      reference: 'FAIL',
      evaluated: 'PASS',
    };

    expect(evaluationCase.id).toBe('D5-C02-case-01');
  });
});
