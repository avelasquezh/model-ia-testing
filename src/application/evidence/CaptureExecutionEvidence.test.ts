import { describe, expect, it } from 'vitest';
import { CaptureExecutionEvidence } from './CaptureExecutionEvidence.js';
import { Execution } from '../../domain/execution/Execution.js';
import { InMemoryExecutionEvidenceRepository } from '../../infrastructure/persistence/InMemoryExecutionEvidenceRepository.js';
import { InMemoryExecutionRepository } from '../../infrastructure/persistence/InMemoryExecutionRepository.js';

describe('CaptureExecutionEvidence', () => {
  class FixedIds {
    generate(): string {
      return 'evidence-001';
    }
  }

  it('captures finished execution observations, errors, target and scenario context', async () => {
    const executions = new InMemoryExecutionRepository();
    const evidence = new InMemoryExecutionEvidenceRepository();
    const startedAt = new Date('2026-09-06T10:00:00.000Z');
    const observedAt = new Date('2026-09-06T10:00:00.750Z');
    const running = new Execution({
      id: 'execution-001',
      scenarioId: 'scenario-001',
      scenarioVersion: 3,
      targetId: 'target-001',
      targetUrl: 'https://example.com/chat',
      targetConfiguration: {
        id: 'target-001',
        name: 'Demo chatbot',
        url: 'https://example.com/chat',
        status: 'ACTIVE',
      },
      status: 'PENDING',
    }).start(startedAt);
    const finished = running.finish(
      'ERROR',
      new Date('2026-09-06T10:00:02.000Z'),
      [{
        input: 'Hola',
        response: 'Hola',
        startedAt,
        observedAt,
        durationMs: 750,
      }],
      [{
        code: 'Error',
        message: 'interaction failure',
        operation: 'SEND',
        turnIndex: 1,
        occurredAt: observedAt,
      }],
    );
    await executions.save(finished);

    const captured = await new CaptureExecutionEvidence(
      executions,
      evidence,
      new FixedIds(),
    ).execute({ executionId: 'execution-001', testSystemVersion: '0.1.0' });

    expect(captured.props).toMatchObject({
      id: 'evidence-001',
      executionId: 'execution-001',
      targetId: 'target-001',
      targetUrl: 'https://example.com/chat',
      targetConfiguration: finished.props.targetConfiguration,
      scenarioVersion: 3,
      testSystemVersion: '0.1.0',
      transcript: finished.props.observations,
      errors: finished.props.errors,
    });
    expect(captured.props.capturedAt).toBeInstanceOf(Date);
    await expect(evidence.findByExecutionId('execution-001')).resolves.toBe(captured);
  });

  it('rejects evidence capture for a running execution', async () => {
    const executions = new InMemoryExecutionRepository();
    const evidence = new InMemoryExecutionEvidenceRepository();
    const running = new Execution({
      id: 'execution-001',
      scenarioId: 'scenario-001',
      scenarioVersion: 1,
      targetId: 'target-001',
      targetUrl: 'https://example.com/chat',
      status: 'RUNNING',
    });
    await executions.save(running);

    await expect(new CaptureExecutionEvidence(
      executions,
      evidence,
      new FixedIds(),
    ).execute({ executionId: 'execution-001', testSystemVersion: '0.1.0' })).rejects.toThrow(
      'Execution must be finished before evidence is captured',
    );
  });
});
