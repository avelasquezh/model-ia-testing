export const FINDING_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export type TestFindingProps = {
  readonly id: string;
  readonly executionId: string;
  readonly evidenceId: string;
  readonly scenarioId: string;
  readonly title: string;
  readonly description: string;
  readonly expected?: string;
  readonly observed?: string;
  readonly severity?: FindingSeverity;
  readonly impact?: string;
  readonly risk?: string;
  readonly createdAt: Date;
};

export class TestFinding {
  public constructor(public readonly props: TestFindingProps) {
    if (!props.id.trim()) throw new Error('Finding id is required');
    if (!props.executionId.trim()) throw new Error('Finding execution id is required');
    if (!props.evidenceId.trim()) throw new Error('Finding evidence id is required');
    if (!props.scenarioId.trim()) throw new Error('Finding scenario id is required');
    if (!props.title.trim()) throw new Error('Finding title is required');
    if (!props.description.trim()) throw new Error('Finding description is required');
    if (!props.createdAt) throw new Error('Finding creation time is required');
  }
}
