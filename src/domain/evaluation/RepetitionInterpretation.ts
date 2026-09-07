export const REPETITION_INTERPRETATIONS = [
  'NON_COMPARABLE',
  'NO_EVALUABLE_OBSERVATION',
  'CONSISTENT_OBSERVED',
  'VARIABLE_OBSERVED',
] as const;

export type RepetitionInterpretation = (typeof REPETITION_INTERPRETATIONS)[number];

export type RepetitionInterpretationProps = {
  readonly interpretation: RepetitionInterpretation;
  readonly reason: string;
};

export class RepetitionInterpretationResult {
  public constructor(public readonly props: RepetitionInterpretationProps) {
    if (!props.reason.trim()) throw new Error('Repetition interpretation reason is required');
  }
}
