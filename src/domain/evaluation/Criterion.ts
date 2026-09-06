export const CRITERION_TYPES = [
  'BOOLEAN',
  'ORDINAL',
  'NUMERIC',
  'COMPARATIVE',
  'NOT_EVALUABLE',
] as const;

export type CriterionType = (typeof CRITERION_TYPES)[number];

export const EVIDENCE_TYPES = [
  'TRANSCRIPT',
  'DOM',
  'SCREENSHOT',
  'TIMING',
  'INTERACTION',
  'BROWSER_METADATA',
  'NETWORK',
  'CONSOLE',
  'ARTIFACT',
  'AI_ANALYSIS',
] as const;

export type CriterionEvidenceType = (typeof EVIDENCE_TYPES)[number];

export type CriterionProps = {
  readonly id: string;
  readonly dimensionId: string;
  readonly type: CriterionType;
  readonly applicableContexts: readonly string[];
  readonly requiredEvidence: readonly CriterionEvidenceType[];
  readonly ruleVersion: string;
};

export class Criterion {
  public constructor(public readonly props: CriterionProps) {
    if (!props.id.trim()) throw new Error('Criterion id is required');
    if (!props.dimensionId.trim()) throw new Error('Criterion dimension id is required');
    if (props.applicableContexts.length === 0) {
      throw new Error('Criterion must declare at least one applicable context');
    }
    if (props.applicableContexts.some((context) => !context.trim())) {
      throw new Error('Criterion applicable contexts are required');
    }
    if (props.requiredEvidence.length === 0) {
      throw new Error('Criterion must declare at least one required evidence type');
    }
    if (!props.ruleVersion.trim()) throw new Error('Criterion rule version is required');
  }

  public appliesTo(context: string): boolean {
    return this.props.applicableContexts.includes(context);
  }
}
