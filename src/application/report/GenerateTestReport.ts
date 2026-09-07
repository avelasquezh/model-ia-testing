import { TestReport, type TestReportExecution } from '../../domain/report/TestReport.js';
import type { ExecutionEvidenceRepository } from '../ports/ExecutionEvidenceRepository.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { ScenarioResultRepository } from '../ports/ScenarioResultRepository.js';
import type { TestFindingRepository } from '../ports/TestFindingRepository.js';
import type { TestReportRepository } from '../ports/TestReportRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';

export type GenerateTestReportInput = {
  readonly executionIds: readonly string[];
};

export class GenerateTestReport {
  public constructor(
    private readonly executions: ExecutionRepository,
    private readonly evidence: ExecutionEvidenceRepository,
    private readonly results: ScenarioResultRepository,
    private readonly findings: TestFindingRepository,
    private readonly reports: TestReportRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: GenerateTestReportInput): Promise<TestReport> {
    if (input.executionIds.length === 0) throw new Error('Report requires at least one execution');

    const reportExecutions: TestReportExecution[] = [];

    for (const executionId of input.executionIds) {
      const execution = await this.executions.findById(executionId);
      if (!execution) throw new Error(`Execution not found: ${executionId}`);
      if (execution.props.status === 'PENDING' || execution.props.status === 'RUNNING') {
        throw new Error(`Report requires a finished execution: ${executionId}`);
      }

      const evidence = await this.evidence.findByExecutionId(execution.props.id);
      if (!evidence) throw new Error(`Execution evidence not found: ${executionId}`);

      const result = await this.results.findByExecutionId(execution.props.id);
      if (!result) throw new Error(`Scenario result not found: ${executionId}`);

      const findings = await this.findings.findByExecutionId(execution.props.id);
      const limitations = this.limitationsFor(result.props.executionOutcome, result.props.cause);

      reportExecutions.push({
        executionId: execution.props.id,
        scenarioId: execution.props.scenarioId,
        scenarioVersion: execution.props.scenarioVersion,
        targetId: execution.props.targetId,
        targetUrl: execution.props.targetUrl,
        executionStatus: execution.props.status,
        resultStatus: result.props.executionOutcome,
        qualityEvaluationStatus: result.props.qualityEvaluationStatus,
        evidenceId: evidence.props.id,
        findingIds: findings.map((finding) => finding.props.id),
        limitations,
      });
    }

    const report = new TestReport({
      id: this.ids.generate(),
      generatedAt: new Date(),
      executions: reportExecutions,
    });

    await this.reports.save(report);
    return report;
  }

  private limitationsFor(status: string, cause?: string): readonly string[] {
    if (status === 'INCONCLUSIVE' || status === 'NOT_EVALUABLE') {
      return [cause ?? 'The available observable evidence is insufficient for complete evaluation'];
    }

    if (status === 'ERROR' || status === 'CANCELLED') {
      return [cause ?? 'Execution did not complete normally'];
    }

    return [];
  }
}
