import { RepetitionSet, type RepetitionOutcomeDistribution } from '../../domain/evaluation/RepetitionSet.js';
import type { Execution } from '../../domain/execution/Execution.js';

export type AnalyzeRepetitionSetInput = {
  readonly executions: readonly Execution[];
};

export type RepetitionSetAnalysis = {
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly repetitionCount: number;
  readonly conditionsComparable: boolean;
  readonly outcomeDistribution: RepetitionOutcomeDistribution;
};

export class AnalyzeRepetitionSet {
  public analyze(input: AnalyzeRepetitionSetInput): RepetitionSetAnalysis {
    const repetitionSet = new RepetitionSet({ executions: input.executions });
    return {
      scenarioId: repetitionSet.scenarioId,
      scenarioVersion: repetitionSet.scenarioVersion,
      repetitionCount: repetitionSet.props.executions.length,
      conditionsComparable: repetitionSet.hasComparableConditions,
      outcomeDistribution: repetitionSet.outcomeDistribution,
    };
  }
}
