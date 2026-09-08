import { createServer, type Server } from 'node:http';
import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';
import { PlaywrightConversationAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightConversationAdapter.js';
import { PlaywrightExecutionRunner } from '../../src/infrastructure/execution/PlaywrightExecutionRunner.js';
import { Execution } from '../../src/domain/execution/Execution.js';
import { Scenario } from '../../src/domain/scenario/Scenario.js';
import { Target } from '../../src/domain/target/Target.js';
import type { ConversationUiConfigRepository } from '../../src/application/ports/ConversationUiConfigRepository.js';
import type { ExecutionEvidenceEvent, ExecutionEvidencePublisher } from '../../src/application/ports/ExecutionEvidencePublisher.js';

const REPETITIONS = 3;

class InMemoryUiConfigRepository implements ConversationUiConfigRepository {
  public constructor(private readonly config: Awaited<ReturnType<ConversationUiConfigRepository['findByTargetUrl']>>) {}

  public async findByTargetUrl(): Promise<Awaited<ReturnType<ConversationUiConfigRepository['findByTargetUrl']>>> {
    return this.config;
  }
}

class RecordingEvidencePublisher implements ExecutionEvidencePublisher {
  public readonly events: ExecutionEvidenceEvent[] = [];

  public async publish(event: ExecutionEvidenceEvent): Promise<void> {
    this.events.push(event);
  }
}

async function reserveAndReleaseUnavailableEndpoint(): Promise<string> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('unreachable after release');
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    throw new Error('D6 availability endpoint did not expose a port');
  }

  const url = `http://127.0.0.1:${address.port}`;
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return url;
}

test('D6-C04: captures reproducible observable unavailability during execution', async () => {
  const unavailableUrl = await reserveAndReleaseUnavailableEndpoint();
  const target = new Target({
    id: 'target-d6-availability-chatbot',
    name: 'D6 unavailable chatbot',
    url: unavailableUrl,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-d6-availability',
    targetId: target.props.id,
    name: 'Observable availability',
    objective: 'Validate observable handling when the conversational target is unavailable.',
    description: 'Controlled target endpoint released before execution to produce reproducible unavailability.',
    inputs: [{ value: 'Consulta de prueba durante indisponibilidad.' }],
    expectedBehavior: 'The execution records an observable opening error when the target is unavailable.',
    finishConditions: [{ description: 'The target unavailability is observable as an execution error.' }],
    version: 1,
  });

  const browser = new PlaywrightBrowserAdapter();
  const uiConfigs: ConversationUiConfigRepository = new InMemoryUiConfigRepository({
    composer: { kind: 'label', value: 'Message' },
    sendButton: { kind: 'role', role: 'button', name: 'Send' },
    response: { kind: 'testId', value: 'response' },
    responseTimeoutMs: 1_000,
    pollIntervalMs: 10,
  });
  const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
  const evidence = new RecordingEvidencePublisher();
  const runner = new PlaywrightExecutionRunner(conversation, evidence);

  for (let repetition = 1; repetition <= REPETITIONS; repetition += 1) {
    const execution = new Execution({
      id: `execution-d6-c04-${repetition}`,
      scenarioId: scenario.props.id,
      scenarioVersion: scenario.props.version,
      targetId: target.props.id,
      targetUrl: target.props.url,
      status: 'PENDING',
    }).start();

    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 5_000 },
    );

    expect(result.status).toBe('ERROR');
    expect(result.observations ?? []).toHaveLength(0);
    const errors = result.errors ?? [];
    expect(errors).toHaveLength(1);
    expect(errors[0]?.operation).toBe('OPEN');
    expect(evidence.events.filter((event) => event.executionId === execution.props.id)).toHaveLength(1);
    expect(evidence.events.find((event) => event.executionId === execution.props.id)?.type).toBe('ERROR');
  }

  expect(evidence.events).toHaveLength(REPETITIONS);
});
