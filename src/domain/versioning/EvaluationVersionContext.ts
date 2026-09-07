export type EvaluationVersionContextProps = {
  readonly productVersion: string;
  readonly evaluationMethodVersion: string;
  readonly criterionCatalogVersion: string;
  readonly decisionRulesVersion: string;
  readonly evaluatorVersion?: string;
  readonly commitSha?: string;
};

const REQUIRED_VERSION_FIELDS = [
  'productVersion',
  'evaluationMethodVersion',
  'criterionCatalogVersion',
  'decisionRulesVersion',
] as const;

export class EvaluationVersionContext {
  public readonly props: EvaluationVersionContextProps;

  public constructor(props: EvaluationVersionContextProps) {
    for (const field of REQUIRED_VERSION_FIELDS) {
      if (!props[field].trim()) {
        throw new Error(`${field} is required`);
      }
    }

    if (props.evaluatorVersion !== undefined && !props.evaluatorVersion.trim()) {
      throw new Error('evaluatorVersion must not be empty when provided');
    }

    if (props.commitSha !== undefined && !props.commitSha.trim()) {
      throw new Error('commitSha must not be empty when provided');
    }

    this.props = Object.freeze({ ...props });
  }
}
