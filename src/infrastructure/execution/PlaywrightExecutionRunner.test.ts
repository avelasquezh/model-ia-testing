import { describe, expect, it, vi } from 'vitest';
import { Execution } from '../../domain/execution/Execution.js';
import { Scenario } from '../../domain/scenario/Scenario.js';
import { Target } from '../../domain/target/Target.js';
import type {
  ConversationPort,
  ConversationResponse,
  ConversationSession,
} from '../../application/ports/ConversationPort.js';
import { PlaywrightExecutionRunner } from './PlaywrightExecutionRunner.js';

function createConversationPort() {
  const responses: ConversationResponse[] = [];
  const session: ConversationSession = {
    send: vi.fn(async (input) => {
      const response: ConversationResponse = {
        value: `Respuesta a: ${input.value}`,
        observedAt: new Date(),
      };
      responses.push(response);
      return response;
    }),
    close: vi.fn().mockResolvedValue(undefined),
  };

  const conversation: ConversationPort = {
    open: vi.fn().mockResolvedValue(session),
  };

  return { conversation, session, responses };
}

function createExecutionContext() {
  const scenario = new Scenario({
    id: 'scenario-1',
    targetId: 'target-1',
    name: 'Greeting',
    objective: 'Validate greeting',
    description: 'Basic conversation',
    inputs: [{ value: 'Hola' }, { value: '¿Cómo estás?' }],
    expectedBehavior: 'Responds to greeting',
    finishConditions: [{ description: 'Assistant responds' }],
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

  return { scenario, target, execution };
}

describe('PlaywrightExecutionRunner', () => {
  it('executes every scenario input through the conversation boundary and captures observations', async () => {
    const { conversation, session, responses } = createConversationPort();
    const { scenario, target, execution } = createExecutionContext();
    const runner = new PlaywrightExecutionRunner(conversation);

    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 5_000 },
    );

    expect(result.status).toBe('INCONCLUSIVE');
    expect(result.observations).toHaveLength(2);

    const first = result.observations?.[0];
    const second = result.observations?.[1];
    expect(first?.input).toBe('Hola');
    expect(first?.response).toBe('Respuesta a: Hola');
    expect(first?.startedAt).toBeInstanceOf(Date);
    expect(first?.observedAt).toEqual(responses[0]?.observedAt);
    expect(first?.durationMs).toBe(
      (first?.observedAt?.getTime() ?? 0) - (first?.startedAt?.getTime() ?? 0),
    );
    expect(first?.durationMs).toBeGreaterThanOrEqual(0);

    expect(second?.input).toBe('¿Cómo estás?');
    expect(second?.response).toBe('Respuesta a: ¿Cómo estás?');
    expect(second?.startedAt).toBeInstanceOf(Date);
    expect(second?.observedAt).toEqual(responses[1]?.observedAt);
    expect(second?.durationMs).toBe(
      (second?.observedAt?.getTime() ?? 0) - (second?.startedAt?.getTime() ?? 0),
    );
    expect(second?.durationMs).toBeGreaterThanOrEqual(0);

    expect(conversation.open).toHaveBeenCalledWith(target.props.url, 5_000);
    expect(session.send).toHaveBeenCalledTimes(2);
    expect(session.send).toHaveBeenNthCalledWith(1, { value: 'Hola' }, 5_000);
    expect(session.send).toHaveBeenNthCalledWith(2, { value: '¿Cómo estás?' }, 5_000);
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('closes the conversation session when an interaction fails', async () => {
    const { conversation, session } = createConversationPort();
    vi.mocked(session.send).mockRejectedValueOnce(new Error('interaction failure'));
    const { scenario, target, execution } = createExecutionContext();
    const runner = new PlaywrightExecutionRunner(conversation);

    await expect(
      runner.execute({ execution, scenario, target }, { timeoutMs: 5_000 }),
    ).rejects.toThrow('interaction failure');

    expect(session.close).toHaveBeenCalledOnce();
  });

  it('does not send a message when cancellation is already requested', async () => {
    const { conversation, session } = createConversationPort();
    const { scenario, target, execution } = createExecutionContext();
    const controller = new AbortController();
    controller.abort();
    const runner = new PlaywrightExecutionRunner(conversation);

    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 5_000, signal: controller.signal },
    );

    expect(result.status).toBe('CANCELLED');
    expect(session.send).not.toHaveBeenCalled();
    expect(session.close).toHaveBeenCalledOnce();
  });
});
