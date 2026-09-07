import { RepetitionSet } from '../../domain/evaluation/RepetitionSet.js';
import { ProportionInterval } from '../../domain/evaluation/ProportionInterval.js';
import type { Execution } from '../../domain/execution/Execution.js';

export type OutcomeRate = {
  readonly successes: number;
  readonly trials: number;
  readonly proportion: number;
  readonly confidenceInterval95: {
    readonly lower: number;
    readonly upper: number;
  };
};

export type RepetitionStatistics = {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly repetitionCount: number;
  readonly conditionsComparable: boolean;
  readonly nTotal: number;
  readonly nEvaluable: number;
  readonly nInconclusive: number;
  readonly nNotEvaluable: number;
  readonly nPass: number;
  readonly nPartial: number;
  readonly nFail: number;
  readonly passRate: OutcomeRate | null;
  readonly partialRate: OutcomeRate | null;
  readonly failRate: OutcomeRate | null;
  readonly nError: number;
  readonly nCancelled: number;
};

const rate = (successes: number, trials: number): OutcomeRate | null => {
  if (trials === 0) return null;
  const interval = ProportionInterval.wilson95(successes, trials);
  return {
    successes: interval.props.successes,
    trials: interval.props.trials,
    proportion: interval.props.proportion,
    confidenceInterval95: {
      lower: interval.props.lower,
      upper: interval.props.upper,
    },
  };
};

export class AnalyzeRepetitionStatistics {
  public analyze(executions: readonly Execution[]): RepetitionStatistics {
    const set = new RepetitionSet({ executions });
    const distribution = set.outcomeDistribution;
    const nEvaluable = distribution.PASSED + distribution.PARTIALLY_PASSED + distribution.FAILED;

    return {
      scenarioId: set.scenarioId,
      scenarioVersion: set.scenarioVersion,
      repetitionCount: executions.length,
      conditionsComparable: set.hasComparableConditions,
      nTotal: executions.length,
      nEvaluable,
      nInconclusive: distribution.INCONCLUSIVE,
      nNotEvaluable: distribution.NOT_EVALUABLE,
      nPass: distribution.PASSED,
      nPartial: distribution.PARTIALLY_PASSED,
      nFail: distribution.FAILED,
      passRate: rate(distribution.PASSED, nEvaluable),
      partialRate: rate(distribution.PARTIALLY_PASSED, nEvaluable),
      failRate: rate(distribution.FAILED, nEvaluable),
      nError: distribution.ERROR,
      nCancelled: distribution.CANCELLED,
    };
  }
}
