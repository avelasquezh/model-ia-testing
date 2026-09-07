import type { RepetitionInterpretation } from '../../domain/evaluation/RepetitionInterpretation.js';
import { MethodologicalJudgmentResult } from '../../domain/evaluation/MethodologicalJudgment.js';

export type BuildMethodologicalJudgmentInput = {
  readonly interpretation: RepetitionInterpretation;
};

export class BuildMethodologicalJudgment {
  public build(input: BuildMethodologicalJudgmentInput): MethodologicalJudgmentResult {
    switch (input.interpretation) {
      case 'CONSISTENT_OBSERVED':
        return new MethodologicalJudgmentResult({
          judgment: 'OBSERVED_CONSISTENT',
          basis: 'The comparable sample shows one evaluable outcome consistently observed across repetitions',
        });
      case 'VARIABLE_OBSERVED':
        return new MethodologicalJudgmentResult({
          judgment: 'OBSERVED_VARIABLE',
          basis: 'The comparable sample shows more than one evaluable outcome across repetitions',
        });
      case 'NON_COMPARABLE':
      case 'NO_EVALUABLE_OBSERVATION':
        return new MethodologicalJudgmentResult({
          judgment: 'NO_JUDGMENT',
          basis: `No quality judgment is derived from interpretation '${input.interpretation}'`,
        });
    }
  }
}
