export const METHODOLOGICAL_JUDGMENTS = [
  'NO_JUDGMENT',
  'OBSERVED_CONSISTENT',
  'OBSERVED_VARIABLE',
] as const;

export type MethodologicalJudgment = (typeof METHODOLOGICAL_JUDGMENTS)[number];

export type MethodologicalJudgmentProps = {
  readonly judgment: MethodologicalJudgment;
  readonly basis: string;
};

export class MethodologicalJudgmentResult {
  public constructor(public readonly props: MethodologicalJudgmentProps) {
    if (!props.basis.trim()) throw new Error('Methodological judgment basis is required');
  }
}
