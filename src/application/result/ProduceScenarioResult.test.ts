import { describe, expect, it } from 'vitest';
import { Execution } from '../../domain/execution/Execution.js';
import { ExecutionEvidence } from '../../domain/evidence/ExecutionEvidence.js';
import type { ExecutionEvidenceRepository } from '../ports/ExecutionEvidenceRepository.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { ScenarioResult } from '../../domain/result/ScenarioResult.js';
import type { ScenarioResultRepository } from '../ports/ScenarioResultRepository.js';
import { ProduceScenarioResult } from './ProduceScenarioResult.js';

class TestExecutionRepository implements ExecutionRepository {
  public constructor(private readonly execution: Execution) {}

  public async save(execution: Execution): Promise<void> {
    this.execution = execution;
  }

  public async findById(id: string): Promise<Execution | null> {
    return id === this.execution.props.id ? this.execution : null;
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
  public saved?: ScenarioResult;

  public async save(result: ScenarioResult): Promise<void> {
    this.saved = result;
  }

  public async findByExecutionId(executionId: string): Promise<ScenarioResult | undefined> {
    return this.saved?.props.executionId === executionId ? this.saved : undefined;
  }
}

class TestIdGenerator implements IdGenerator {
  public generate(): string {
    return 'result-1';
  }
}

function createExecution(status: 'INCONCLUSIVE' | 'NOT_EVALUABLE' | 'ERROR' | 'CANCELLED' | 'RUNNING'): Execution {
  const pending = new Execution({
    id: 'execution-1',
    scenarioId: 'scenario-1',
    scenarioVersion: 2,
    targetId: 'target-1',
    targetUrl: 'https://example.test/chat',
    status: 'PENDING',
  });

  const running = pending.start(new Date('2026-09-06T10:00:00.000Z'));
  if (status === 'RUNNING') return running;

  return running.finish(status, new Date('2026-09-06T10:00:05.000Z'));
}

function createEvidence(): ExecutionEvidence {
  return new ExecutionEvidence({
    id: 'evidence-1',
    executionId: 'execution-1',
    targetId: 'target-1',
    targetUrl: 'https://example.test/chat',
    scenarioVersion: 2,
    testSystemVersion: '0.1.0',
    transcript: [],
    errors: [],
    capturedAt: new Date('2026-09-06T10:00:06.000Z'),
  });
}

describe('ProduceScenarioResult', () => {
  it('produces an execution result linked to evidence without performing quality evaluation', async () => {
    const results = new TestResultRepository();
    const useCase = new ProduceScenarioResult(
      new TestExecutionRepository(createExecution('INCONCLUSIVE')),
      new TestEvidenceRepository(createEvidence()),
      results,
      new TestIdGenerator(),
    );

    const result = await useCase.execute({ executionId: 'execution-1' });

    expect(result.props.executionOutcome).toBe('INCONCLUSIVE');
    expect(result.props.qualityEvaluationStatus).toBe('NOT_EVALUATED');
    expect(result.props.evidenceId).toBe('evidence-1');
    expect(result.props.cause).toContain('observable execution evidence');
    expect(results.saved?.props.executionId).toBe('execution-1');
  });

  it('requires a finished execution', async () => {
    const useCase = new ProduceScenarioResult(
      new TestExecutionRepository(createExecution('RUNNING')),
      new TestEvidenceRepository(createEvidence()),
      new TestResultRepository(),
      new TestIdGenerator(),
    );

    await expect(useCase.execute({ executionId: 'execution-1' })).rejects.toThrow(
      'Scenario result requires a finished execution',
    );
  });

  it('requires execution evidence before producing the result', async () => {
    const useCase = new ProduceScenarioResult(
      new TestExecutionRepository(createExecution('INCONCLUSIVE')),
      new TestEvidenceRepository(undefined),
      new TestResultRepository(),
      new TestIdGenerator(),
    );

    await expect(useCase.execute({ executionId: 'execution-1' })).rejects.toThrow(
      'Execution evidence not found',
    );
  });

  it('records the execution error as the cause of an error result', async () => {
    const execution = createExecution('INCONCLUSIVE').finish('ERROR', new Date('2026-09-06T10:00:05.000Z'), [], [
      {
        code: 'TIMEOUT',
        message: 'Execution timeout exceeded',
        operation: 'SEND',
        turnIndex: 0,
        occurredAt: new Date('2026-09-06T10:00:04.000Z'),
      },
    ]);

    const results = new TestResultRepository();
    const useCase = new ProduceScenarioResult(
      new TestExecutionRepository(execution),
      new TestEvidenceRepository(createEvidence()),
      results,
      new TestIdGenerator(),
    );

    const result = await useCase.execute({ executionId: 'execution-1' });

    expect(result.props.executionOutcome).toBe('ERROR');
    expect(result.props.cause).toBe('Execution timeout exceeded');
  });
});
