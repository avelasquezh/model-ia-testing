export type EvidenceType =
  | 'TRANSCRIPT'
  | 'DOM'
  | 'SCREENSHOT'
  | 'TIMING'
  | 'INTERACTION'
  | 'BROWSER_METADATA'
  | 'NETWORK'
  | 'CONSOLE'
  | 'ARTIFACT'
  | 'AI_ANALYSIS';

export type EvidenceUnitProps = {
  readonly id: string;
  readonly runId: string;
  readonly scenarioId: string;
  readonly stepId?: string;
  readonly timestamp: Date;
  readonly evidenceType: EvidenceType;
  readonly source: string;
  readonly contentReference: string;
  readonly captureMethod: string;
  readonly integrityReference?: string;
  readonly metadata?: Readonly<Record<string, string>>;
};

export class EvidenceUnit {
  public constructor(public readonly props: EvidenceUnitProps) {
    if (!props.id.trim()) throw new Error('Evidence unit id is required');
    if (!props.runId.trim()) throw new Error('Evidence unit run id is required');
    if (!props.scenarioId.trim()) throw new Error('Evidence unit scenario id is required');
    if (props.stepId !== undefined && !props.stepId.trim()) {
      throw new Error('Evidence unit step id cannot be empty');
    }
    if (!props.timestamp || Number.isNaN(props.timestamp.getTime())) {
      throw new Error('Evidence unit timestamp must be a valid date');
    }
    if (!props.source.trim()) throw new Error('Evidence unit source is required');
    if (!props.contentReference.trim()) {
      throw new Error('Evidence unit content reference is required');
    }
    if (!props.captureMethod.trim()) {
      throw new Error('Evidence unit capture method is required');
    }
  }

  public get isPrimaryEvidence(): boolean {
    return this.props.evidenceType !== 'AI_ANALYSIS';
  }
}
