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

const RESPONSE_DELAY_MS = 400;
const OBSERVATION_TIMEOUT_MS = 100;

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

function startSlowChatbot(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>D6 Timeout observable chatbot</h1>
      <label for="composer">Message</label>
      <input id="composer" aria-label="Message" />
      <button id="send" type="button">Send</button>
      <div id="messages"></div>
      <script>
        const input = document.getElementById('composer');
        const send = document.getElementById('send');
        const messages = document.getElementById('messages');

        function reply() {
          const value = input.value.trim();
          if (!value) return;

          window.setTimeout(() => {
            const item = document.createElement('p');
            item.setAttribute('data-testid', 'response');
            item.textContent = 'Bot response: Respuesta tardía.';
            messages.appendChild(item);
            input.value = '';
          }, ${RESPONSE_DELAY_MS});
        }

        send.addEventListener('click', reply);
      </script>
    </main>
  </body>
</html>`);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('D6 timeout chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D6-C03: captures an observable timeout when the response exceeds the configured limit', async () => {
  const controlled = await startSlowChatbot();
  const target = new Target({
    id: 'target-d6-timeout-chatbot',
    name: 'D6 Timeout observable chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-d6-timeout',
    targetId: target.props.id,
    name: 'Observable timeout',
    objective: 'Validate observable timeout handling when a response exceeds the configured limit.',
    description: 'Controlled browser chatbot used to validate D6-C03.',
    inputs: [{ value: 'Consulta de prueba con respuesta tardía.' }],
    expectedBehavior: 'The execution records a timeout when no response becomes observable within the configured limit.',
    finishConditions: [{ description: 'The timeout is observable as an execution error.' }],
    version: 1,
  });

  try {
    const browser = new PlaywrightBrowserAdapter();
    const uiConfigs: ConversationUiConfigRepository = new InMemoryUiConfigRepository({
      composer: { kind: 'label', value: 'Message' },
      sendButton: { kind: 'role', role: 'button', name: 'Send' },
      response: { kind: 'testId', value: 'response' },
      responseTimeoutMs: OBSERVATION_TIMEOUT_MS,
      pollIntervalMs: 10,
    });
    const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
    const evidence = new RecordingEvidencePublisher();
    const runner = new PlaywrightExecutionRunner(conversation, evidence);
    const execution = new Execution({
      id: 'execution-d6-c03-1',
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
    expect(errors[0]?.operation).toBe('SEND');
    expect(errors[0]?.message).toBe('Conversation response was not observed before timeout');
    expect(evidence.events).toHaveLength(1);
    expect(evidence.events[0]?.type).toBe('ERROR');
    expect(evidence.events[0]?.executionId).toBe(execution.props.id);
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
