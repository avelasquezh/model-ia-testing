import { describe, expect, it } from 'vitest';
import { Execution } from '../../domain/execution/Execution.js';
import { ExecutionEvidence } from '../../domain/evidence/ExecutionEvidence.js';
import { ScenarioResult } from '../../domain/result/ScenarioResult.js';
import type { TestFinding } from '../../domain/finding/TestFinding.js';
import type { ExecutionEvidenceRepository } from '../ports/ExecutionEvidenceRepository.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { ScenarioResultRepository } from '../ports/ScenarioResultRepository.js';
import type { TestFindingRepository as FindingRepository } from '../ports/TestFindingRepository.js';
import type { TestReport } from '../../domain/report/TestReport.js';
import type { TestReportRepository as ReportRepository } from '../ports/TestReportRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import { GenerateTestReport } from './GenerateTestReport.js';

class TestExecutionRepository implements ExecutionRepository {
  public constructor(private readonly value: Execution) {}
  public async save(): Promise<void> {}
  public async findById(id: string): Promise<Execution | null> {
    return this.value.props.id === id ? this.value : null;
  }
}

class TestEvidenceRepository implements ExecutionEvidenceRepository {
  public constructor(private readonly value: ExecutionEvidence | undefined) {}
  public async save(): Promise<void> {}
  public async findByExecutionId(executionId: string): Promise<ExecutionEvidence | undefined> {
    return this.value?.props.executionId === executionId ? this.value : undefined;
  }
}

class TestResultRepository implements ScenarioResultRepository {
  public constructor(private readonly value: ScenarioResult | undefined) {}
  public async save(): Promise<void> {}
  public async findByExecutionId(executionId: string): Promise<ScenarioResult | undefined> {
    return this.value?.props.executionId === executionId ? this.value : undefined;
  }
}

class TestFindingRepository implements FindingRepository {
  public constructor(private readonly values: readonly TestFinding[]) {}
  public async save(): Promise<void> {}
  public async findById(id: string): Promise<TestFinding | undefined> {
    return this.values.find((finding) => finding.props.id === id);
  }
  public async findByExecutionId(executionId: string): Promise<readonly TestFinding[]> {
    return this.values.filter((finding) => finding.props.executionId === executionId);
  }
}

class TestReportRepository implements ReportRepository {
  public saved?: TestReport;
  public async save(report: TestReport): Promise<void> {
    this.saved = report;
  }
  public async findById(id: string): Promise<TestReport | undefined> {
    return this.saved?.props.id === id ? this.saved : undefined;
  }
}

class TestIdGenerator implements IdGenerator {
  public generate(): string {
    return 'report-1';
  }
}

function createFinishedExecution(): Execution {
  return new Execution({
    id: 'execution-1',
    scenarioId: 'scenario-1',
    scenarioVersion: 2,
    targetId: 'target-1',
    targetUrl: 'https://example.test/chat',
    status: 'PENDING',
  })
    .start(new Date('2026-09-06T10:00:00.000Z'))
    .finish('INCONCLUSIVE', new Date('2026-09-06T10:00:05.000Z'));
}

function createEvidence(executionId = 'execution-1'): ExecutionEvidence {
  return new ExecutionEvidence({
    id: `evidence-${executionId}`,
    executionId,
    targetId: 'target-1',
    targetUrl: 'https://example.test/chat',
    scenarioVersion: 2,
    testSystemVersion: '0.1.0',
    transcript: [],
    errors: [],
    capturedAt: new Date('2026-09-06T10:00:06.000Z'),
  });
}

function createResult(executionId = 'execution-1', scenarioId = 'scenario-1'): ScenarioResult {
  return new ScenarioResult({
    id: `result-${executionId}`,
    executionId,
    scenarioId,
    scenarioVersion: 2,
    evidenceId: `evidence-${executionId}`,
    executionOutcome: 'INCONCLUSIVE',
    qualityEvaluationStatus: 'NOT_EVALUATED',
    cause: 'Observable evidence is insufficient for quality evaluation',
    createdAt: new Date('2026-09-06T10:00:07.000Z'),
  });
}

describe('GenerateTestReport', () => {
  it('generates a report that preserves traceability and observable limitations', async () => {
    const reports = new TestReportRepository();
    const useCase = new GenerateTestReport(
      new TestExecutionRepository(createFinishedExecution()),
      new TestEvidenceRepository(createEvidence()),
      new TestResultRepository(createResult()),
      new TestFindingRepository([]),
      reports,
      new TestIdGenerator(),
    );

    const report = await useCase.execute({ executionIds: ['execution-1'] });

    expect(report.props.id).toBe('report-1');
    expect(report.props.executions).toHaveLength(1);
    expect(report.props.executions[0]?.evidenceId).toBe('evidence-execution-1');
    expect(report.props.executions[0]?.resultStatus).toBe('INCONCLUSIVE');
    expect(report.props.executions[0]?.qualityEvaluationStatus).toBe('NOT_EVALUATED');
    expect(report.props.executions[0]?.limitations).toContain(
      'Observable evidence is insufficient for quality evaluation',
    );
    expect(reports.saved).toBe(report);
  });

  it('supports multiple executions in one report', async () => {
    const execution1 = createFinishedExecution();
    const execution2 = new Execution({
      id: 'execution-2',
      scenarioId: 'scenario-2',
      scenarioVersion: 1,
      targetId: 'target-1',
      targetUrl: 'https://example.test/chat',
      status: 'PENDING',
    })
      .start(new Date('2026-09-06T10:01:00.000Z'))
      .finish('CANCELLED', new Date('2026-09-06T10:01:05.000Z'));

    class MultiExecutionRepository implements ExecutionRepository {
      public async save(): Promise<void> {}
      public async findById(id: string): Promise<Execution | null> {
        return [execution1, execution2].find((execution) => execution.props.id === id) ?? null;
      }
    }

    class MultiEvidenceRepository implements ExecutionEvidenceRepository {
      public async save(): Promise<void> {}
      public async findByExecutionId(executionId: string): Promise<ExecutionEvidence | undefined> {
        return createEvidence(executionId);
      }
    }

    class MultiResultRepository implements ScenarioResultRepository {
      public async save(): Promise<void> {}
      public async findByExecutionId(executionId: string): Promise<ScenarioResult | undefined> {
        return createResult(
          executionId,
          executionId === 'execution-1' ? 'scenario-1' : 'scenario-2',
        );
      }
    }

    const useCase = new GenerateTestReport(
      new MultiExecutionRepository(),
      new MultiEvidenceRepository(),
      new MultiResultRepository(),
      new TestFindingRepository([]),
      new TestReportRepository(),
      new TestIdGenerator(),
    );

    const report = await useCase.execute({ executionIds: ['execution-1', 'execution-2'] });

    expect(report.props.executions.map((entry) => entry.executionId)).toEqual([
      'execution-1',
      'execution-2',
    ]);
  });

  it('requires a result for every execution', async () => {
    const useCase = new GenerateTestReport(
      new TestExecutionRepository(createFinishedExecution()),
      new TestEvidenceRepository(createEvidence()),
      new TestResultRepository(undefined),
      new TestFindingRepository([]),
      new TestReportRepository(),
      new TestIdGenerator(),
    );

    await expect(useCase.execute({ executionIds: ['execution-1'] })).rejects.toThrow(
      'Scenario result not found: execution-1',
    );
  });
});
