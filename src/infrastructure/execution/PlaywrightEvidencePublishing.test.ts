import { describe, expect, it, vi } from 'vitest';
import { Execution } from '../../domain/execution/Execution.js';
import { Scenario } from '../../domain/scenario/Scenario.js';
import { Target } from '../../domain/target/Target.js';
import type {
  ConversationPort,
  ConversationResponse,
  ConversationSession,
} from '../../application/ports/ConversationPort.js';
import type { ExecutionEvidenceEvent } from '../../application/ports/ExecutionEvidencePublisher.js';
import { InMemoryExecutionEvidencePublisher } from './InMemoryExecutionEvidencePublisher.js';
import { PlaywrightExecutionRunner } from './PlaywrightExecutionRunner.js';

function createContext() {
  const screenshot = new Uint8Array([137, 80, 78, 71]);
  const response: ConversationResponse = {
    value: 'Respuesta',
    observedAt: new Date('2026-09-06T12:00:01Z'),
    screenshot,
  };

  const session: ConversationSession = {
    send: vi.fn().mockResolvedValue(response),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const conversation: ConversationPort = {
    open: vi.fn().mockResolvedValue(session),
  };
  const publisher = new InMemoryExecutionEvidencePublisher();

  const scenario = new Scenario({
    id: 'scenario-1',
    targetId: 'target-1',
    name: 'Evidence',
    objective: 'Capture screenshot evidence',
    description: 'Evidence publishing',
    inputs: [{ value: 'Hola' }],
    expectedBehavior: 'Responds',
    finishConditions: [{ description: 'Response received' }],
    version: 1,
  });
  const target = new Target({
    id: 'target-1',
    name: 'Demo',
    url: 'https://example.com/chat',
    status: 'ACTIVE',
  });
  const execution = new Execution({
    id: 'execution-1',
    scenarioId: scenario.props.id,
    scenarioVersion: scenario.props.version,
    targetId: target.props.id,
    targetUrl: target.props.url,
    status: 'RUNNING',
  });

  return { conversation, publisher, session, scenario, target, execution, screenshot };
}

describe('Playwright execution evidence publishing', () => {
  it('publishes the screenshot immediately after each observed turn', async () => {
    const { conversation, publisher, session, scenario, target, execution, screenshot } = createContext();
    const runner = new PlaywrightExecutionRunner(conversation, publisher);

    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 5_000 },
    );

    expect(result.observations).toHaveLength(1);
    expect(publisher.events).toHaveLength(1);

    const event = publisher.events[0] as Extract<ExecutionEvidenceEvent, { type: 'OBSERVATION' }>;
    expect(event.type).toBe('OBSERVATION');
    expect(event.executionId).toBe('execution-1');
    expect(event.turnIndex).toBe(0);
    expect(event.observation.screenshot).toEqual(screenshot);
    expect(session.close).toHaveBeenCalledOnce();
  });
});
