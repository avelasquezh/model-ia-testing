import type { RepetitionStatistics } from './AnalyzeRepetitionStatistics.js';
import {
  RepetitionInterpretationResult,
  type RepetitionInterpretation,
} from '../../domain/evaluation/RepetitionInterpretation.js';

export type InterpretRepetitionStatisticsInput = {
  readonly statistics: RepetitionStatistics;
};

export type InterpretedRepetitionStatistics = {
  readonly interpretation: RepetitionInterpretation;
  readonly reason: string;
};

export class InterpretRepetitionStatistics {
  public interpret(input: InterpretRepetitionStatisticsInput): InterpretedRepetitionStatistics {
    const statistics = input.statistics;

    if (!statistics.conditionsComparable) {
      return this.result(
        'NON_COMPARABLE',
        'Execution conditions are not comparable, so the observed distribution must not be interpreted as homogeneous repetition variability.',
      );
    }

    if (statistics.nEvaluable === 0) {
      return this.result(
        'NO_EVALUABLE_OBSERVATION',
        'No PASS, PARTIAL or FAIL outcome is available for interpretation; indeterminate and technical states remain separate observations.',
      );
    }

    const distinctOutcomes = Number(statistics.nPass > 0) + Number(statistics.nPartial > 0) + Number(statistics.nFail > 0);

    if (distinctOutcomes === 1) {
      return this.result(
        'CONSISTENT_OBSERVED',
        'All evaluable repetitions in the observed sample have the same outcome; this describes sample consistency only and does not establish product quality or acceptance.',
      );
    }

    return this.result(
      'VARIABLE_OBSERVED',
      'The evaluable repetitions contain more than one observed outcome; this establishes observed variability without determining defect reproducibility, significance or acceptance.',
    );
  }

  private result(
    interpretation: RepetitionInterpretation,
    reason: string,
  ): InterpretedRepetitionStatistics {
    const result = new RepetitionInterpretationResult({ interpretation, reason });
    return result.props;
  }
}
