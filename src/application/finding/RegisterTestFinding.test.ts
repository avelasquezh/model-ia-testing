import { describe, expect, it } from 'vitest';
import { Execution } from '../../domain/execution/Execution.js';
import { ExecutionEvidence } from '../../domain/evidence/ExecutionEvidence.js';
import type { ExecutionEvidenceRepository } from '../ports/ExecutionEvidenceRepository.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { TestFinding } from '../../domain/finding/TestFinding.js';
import type { TestFindingRepository as FindingRepository } from '../ports/TestFindingRepository.js';
import { RegisterTestFinding } from './RegisterTestFinding.js';

class TestExecutionRepository implements ExecutionRepository {
  public constructor(private execution: Execution) {}

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

class TestFindingRepository implements FindingRepository {
  public saved?: TestFinding;

  public async save(finding: TestFinding): Promise<void> {
    this.saved = finding;
  }

  public async findById(id: string): Promise<TestFinding | undefined> {
    return this.saved?.props.id === id ? this.saved : undefined;
  }

  public async findByExecutionId(executionId: string): Promise<readonly TestFinding[]> {
    return this.saved?.props.executionId === executionId && this.saved ? [this.saved] : [];
  }
}

class TestIdGenerator implements IdGenerator {
  public generate(): string {
    return 'finding-1';
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
    .finish('FAILED', new Date('2026-09-06T10:00:05.000Z'));
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

describe('RegisterTestFinding', () => {
  it('registers a finding linked to the execution and its evidence', async () => {
    const findings = new TestFindingRepository();
    const useCase = new RegisterTestFinding(
      new TestExecutionRepository(createFinishedExecution()),
      new TestEvidenceRepository(createEvidence()),
      findings,
      new TestIdGenerator(),
    );

    const finding = await useCase.execute({
      executionId: 'execution-1',
      title: 'Response does not match the expected behavior',
      description: 'The observed response differs from the scenario expectation.',
      expected: 'The chatbot should provide the requested information.',
      observed: 'The chatbot returned an unrelated response.',
      severity: 'MEDIUM',
    });

    expect(finding.props.id).toBe('finding-1');
    expect(finding.props.executionId).toBe('execution-1');
    expect(finding.props.evidenceId).toBe('evidence-1');
    expect(finding.props.scenarioId).toBe('scenario-1');
    expect(finding.props.severity).toBe('MEDIUM');
    expect(findings.saved).toBe(finding);
  });

  it('requires a finished execution', async () => {
    const running = new Execution({
      id: 'execution-1',
      scenarioId: 'scenario-1',
      scenarioVersion: 1,
      targetId: 'target-1',
      targetUrl: 'https://example.test/chat',
      status: 'PENDING',
    }).start();

    const useCase = new RegisterTestFinding(
      new TestExecutionRepository(running),
      new TestEvidenceRepository(createEvidence()),
      new TestFindingRepository(),
      new TestIdGenerator(),
    );

    await expect(
      useCase.execute({
        executionId: 'execution-1',
        title: 'Finding',
        description: 'Finding description',
      }),
    ).rejects.toThrow('Finding requires a finished execution');
  });

  it('requires execution evidence', async () => {
    const useCase = new RegisterTestFinding(
      new TestExecutionRepository(createFinishedExecution()),
      new TestEvidenceRepository(undefined),
      new TestFindingRepository(),
      new TestIdGenerator(),
    );

    await expect(
      useCase.execute({
        executionId: 'execution-1',
        title: 'Finding',
        description: 'Finding description',
      }),
    ).rejects.toThrow('Execution evidence not found');
  });

  it('rejects evidence from another execution', async () => {
    const useCase = new RegisterTestFinding(
      new TestExecutionRepository(createFinishedExecution()),
      new TestEvidenceRepository(createEvidence()),
      new TestFindingRepository(),
      new TestIdGenerator(),
    );

    await expect(
      useCase.execute({
        executionId: 'execution-1',
        evidenceId: 'evidence-other',
        title: 'Finding',
        description: 'Finding description',
      }),
    ).rejects.toThrow('Finding evidence does not belong to execution');
  });
});
