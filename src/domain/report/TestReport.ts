export type TestReportExecution = {
  readonly executionId: string;
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly targetId: string;
  readonly targetUrl: string;
  readonly executionStatus: string;
  readonly resultStatus: string;
  readonly qualityEvaluationStatus: string;
  readonly evidenceId: string;
  readonly findingIds: readonly string[];
  readonly limitations: readonly string[];
};

export type TestReportProps = {
  readonly id: string;
  readonly generatedAt: Date;
  readonly executions: readonly TestReportExecution[];
};

export class TestReport {
  public constructor(public readonly props: TestReportProps) {
    if (!props.id.trim()) throw new Error('Report id is required');
    if (!props.generatedAt) throw new Error('Report generation time is required');
    if (props.executions.length === 0) throw new Error('Report must contain at least one execution');
  }
}
