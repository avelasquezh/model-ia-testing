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

    expect(conversation.open).toHaveBeenCalledWith(target.props.url, expect.any(Number));
    expect(session.send).toHaveBeenCalledTimes(2);
    expect(session.send).toHaveBeenNthCalledWith(1, { value: 'Hola' }, expect.any(Number));
    expect(session.send).toHaveBeenNthCalledWith(2, { value: '¿Cómo estás?' }, expect.any(Number));
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('uses the remaining global timeout for each operation', async () => {
    const { conversation, session } = createConversationPort();
    const now = vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(2_500)
      .mockReturnValueOnce(4_500);
    const { scenario, target, execution } = createExecutionContext();
    const runner = new PlaywrightExecutionRunner(conversation);

    try {
      const result = await runner.execute(
        { execution, scenario, target },
        { timeoutMs: 5_000 },
      );

      expect(result.status).toBe('INCONCLUSIVE');
      expect(conversation.open).toHaveBeenCalledWith(target.props.url, 5_000);
      expect(session.send).toHaveBeenNthCalledWith(1, { value: 'Hola' }, 3_500);
      expect(session.send).toHaveBeenNthCalledWith(2, { value: '¿Cómo estás?' }, 1_500);
    } finally {
      now.mockRestore();
    }
  });

  it('fails before starting the next turn when the global timeout is exhausted', async () => {
    const { conversation, session } = createConversationPort();
    const now = vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(7_000);
    const { scenario, target, execution } = createExecutionContext();
    const runner = new PlaywrightExecutionRunner(conversation);

    try {
      const result = await runner.execute(
        { execution, scenario, target },
        { timeoutMs: 5_000 },
      );

      expect(result.status).toBe('ERROR');
      expect(result.observations).toHaveLength(0);
      expect(result.errors?.[0]?.code).toBe('TIMEOUT');
      expect(result.errors?.[0]?.operation).toBe('SEND');
      expect(result.errors?.[0]?.turnIndex).toBe(0);
      expect(session.send).not.toHaveBeenCalled();
      expect(session.close).toHaveBeenCalledOnce();
    } finally {
      now.mockRestore();
    }
  });

  it('captures an interaction error and preserves observations from previous turns', async () => {
    const { conversation, session } = createConversationPort();
    vi.mocked(session.send).mockImplementationOnce(async (input) => ({
      value: `Respuesta a: ${input.value}`,
      observedAt: new Date(),
    })).mockRejectedValueOnce(new Error('interaction failure'));
    const { scenario, target, execution } = createExecutionContext();
    const runner = new PlaywrightExecutionRunner(conversation);

    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 5_000 },
    );

    expect(result.status).toBe('ERROR');
    expect(result.observations).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0]?.code).toBe('Error');
    expect(result.errors?.[0]?.message).toBe('interaction failure');
    expect(result.errors?.[0]?.operation).toBe('SEND');
    expect(result.errors?.[0]?.turnIndex).toBe(1);
    expect(result.errors?.[0]?.occurredAt).toBeInstanceOf(Date);
    expect(session.close).toHaveBeenCalledOnce();
  });

  it('captures an error when opening the conversation fails', async () => {
    const { conversation } = createConversationPort();
    vi.mocked(conversation.open).mockRejectedValueOnce(new Error('navigation failure'));
    const { scenario, target, execution } = createExecutionContext();
    const runner = new PlaywrightExecutionRunner(conversation);

    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 5_000 },
    );

    expect(result.status).toBe('ERROR');
    expect(result.observations).toBeUndefined();
    expect(result.errors?.[0]?.operation).toBe('OPEN');
    expect(result.errors?.[0]?.message).toBe('navigation failure');
  });

  it('captures an error when closing the conversation fails', async () => {
    const { conversation, session } = createConversationPort();
    vi.mocked(session.close).mockRejectedValueOnce(new Error('close failure'));
    const { scenario, target, execution } = createExecutionContext();
    const runner = new PlaywrightExecutionRunner(conversation);

    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 5_000 },
    );

    expect(result.status).toBe('ERROR');
    expect(result.observations).toHaveLength(2);
    expect(result.errors?.[0]?.operation).toBe('CLOSE');
    expect(result.errors?.[0]?.message).toBe('close failure');
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
