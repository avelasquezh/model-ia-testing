import { describe, expect, it } from 'vitest';
import type { RepetitionStatistics } from './AnalyzeRepetitionStatistics.js';
import { InterpretRepetitionStatistics } from './InterpretRepetitionStatistics.js';

const statistics = (overrides: Partial<RepetitionStatistics> = {}): RepetitionStatistics => ({
  scenarioId: 'scenario-1',
  scenarioVersion: 2,
  repetitionCount: 3,
  conditionsComparable: true,
  nTotal: 3,
  nEvaluable: 3,
  nInconclusive: 0,
  nNotEvaluable: 0,
  nPass: 2,
  nPartial: 0,
  nFail: 1,
  passRate: null,
  partialRate: null,
  failRate: null,
  nError: 0,
  nCancelled: 0,
  ...overrides,
});

describe('InterpretRepetitionStatistics', () => {
  const interpreter = new InterpretRepetitionStatistics();

  it('marks comparable mixed evaluable outcomes as observed variability', () => {
    expect(interpreter.interpret({ statistics: statistics() })).toEqual({
      interpretation: 'VARIABLE_OBSERVED',
      reason: expect.stringContaining('more than one observed outcome'),
    });
  });

  it('marks a single observed evaluable outcome as consistency without judging quality', () => {
    const result = interpreter.interpret({
      statistics: statistics({ nPass: 3, nPartial: 0, nFail: 0 }),
    });

    expect(result.interpretation).toBe('CONSISTENT_OBSERVED');
    expect(result.reason).toContain('does not establish product quality or acceptance');
  });

  it('refuses to interpret non-comparable conditions as homogeneous variability', () => {
    expect(interpreter.interpret({
      statistics: statistics({ conditionsComparable: false }),
    }).interpretation).toBe('NON_COMPARABLE');
  });

  it('reports absence of evaluable observations separately', () => {
    expect(interpreter.interpret({
      statistics: statistics({
        nEvaluable: 0,
        nPass: 0,
        nPartial: 0,
        nFail: 0,
        nInconclusive: 2,
        nNotEvaluable: 1,
      }),
    }).interpretation).toBe('NO_EVALUABLE_OBSERVATION');
  });
});
