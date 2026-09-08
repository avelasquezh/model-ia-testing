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

function startVisibleChannel(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>Chatbot</h1>
      <section aria-label="Canal de conversación">
        <label for="composer">Mensaje</label>
        <input id="composer" aria-label="Mensaje" />
        <button id="send" type="button">Enviar</button>
        <div id="messages" aria-live="polite"></div>
      </section>
    </main>
  </body>
</html>`);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('D7 channel server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D7-C01: verifies that the conversation channel is visible and usable', async () => {
  const controlled = await startVisibleChannel();
  const target = new Target({
    id: 'target-d7-channel-visibility',
    name: 'D7 visible conversation channel',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-d7-c01',
    targetId: target.props.id,
    name: 'Visible conversation channel',
    objective: 'Verify that the user can identify the conversation channel and its required controls.',
    description: 'Controlled browser page used to validate D7-C01.',
    inputs: [{ value: 'Mensaje de prueba.' }],
    expectedBehavior: 'The conversation channel, message input and send control are visible.',
    finishConditions: [{ description: 'Required conversation controls are visible.' }],
    version: 1,
  });

  try {
    const browser = new PlaywrightBrowserAdapter();
    const uiConfigs: ConversationUiConfigRepository = new InMemoryUiConfigRepository({
      composer: { kind: 'label', value: 'Mensaje' },
      sendButton: { kind: 'role', role: 'button', name: 'Enviar' },
      response: { kind: 'testId', value: 'response' },
      responseTimeoutMs: 1_000,
      pollIntervalMs: 10,
    });
    const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
    const evidence = new RecordingEvidencePublisher();
    const runner = new PlaywrightExecutionRunner(conversation, evidence);
    const execution = new Execution({
      id: 'execution-d7-c01-1',
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
    expect(result.errors ?? []).toHaveLength(1);
    expect(result.errors?.[0]?.operation).toBe('SEND');
    expect(result.errors?.[0]?.message).toContain('Conversation response was not observed before timeout');
    expect(evidence.events).toHaveLength(1);
    expect(evidence.events[0]?.type).toBe('ERROR');
    expect(evidence.events[0]?.executionId).toBe(execution.props.id);
    expect(JSON.stringify(result)).not.toContain('qualityScore');
    expect(JSON.stringify(result)).not.toContain('globalDecision');
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
