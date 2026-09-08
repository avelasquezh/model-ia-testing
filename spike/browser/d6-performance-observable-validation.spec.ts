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

const EXPECTED_MIN_DELAY_MS = 80;

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

function startPerformanceChatbot(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>D6 Performance observable chatbot</h1>
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
            item.textContent = 'Bot response: Solicitud procesada.';
            messages.appendChild(item);
            input.value = '';
          }, ${EXPECTED_MIN_DELAY_MS});
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
        reject(new Error('D6 chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D6-C01: measures observable time to first response against a configured threshold', async () => {
  const controlled = await startPerformanceChatbot();
  const target = new Target({
    id: 'target-d6-performance-chatbot',
    name: 'D6 Performance observable chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-d6-performance',
    targetId: target.props.id,
    name: 'Observable first-response timing',
    objective: 'Measure elapsed observable time from message submission until the first response is visible.',
    description: 'Controlled browser chatbot used to validate D6-C01.',
    inputs: [{ value: 'Consulta de prueba de rendimiento.' }],
    expectedBehavior: 'A response becomes observable after a controlled delay that is measurable externally.',
    finishConditions: [{ description: 'The first response is observable.' }],
    version: 1,
  });

  try {
    const durations: number[] = [];
    const evidenceCounts: number[] = [];

    for (const index of [1, 2, 3]) {
      const browser = new PlaywrightBrowserAdapter();
      const uiConfigs: ConversationUiConfigRepository = new InMemoryUiConfigRepository({
        composer: { kind: 'label', value: 'Message' },
        sendButton: { kind: 'role', role: 'button', name: 'Send' },
        response: { kind: 'testId', value: 'response' },
        responseTimeoutMs: 5_000,
        pollIntervalMs: 10,
      });
      const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
      const evidence = new RecordingEvidencePublisher();
      const runner = new PlaywrightExecutionRunner(conversation, evidence);
      const execution = new Execution({
        id: `execution-d6-c01-${index}`,
        scenarioId: scenario.props.id,
        scenarioVersion: scenario.props.version,
        targetId: target.props.id,
        targetUrl: target.props.url,
        status: 'PENDING',
      }).start();

      const result = await runner.execute(
        { execution, scenario, target },
        { timeoutMs: 15_000 },
      );

      const observation = result.observations?.[0];
      expect(result.status).toBe('INCONCLUSIVE');
      expect(result.errors ?? []).toHaveLength(0);
      expect(observation?.response).toBe('Bot response: Solicitud procesada.');
      expect(observation?.durationMs).toBeGreaterThanOrEqual(EXPECTED_MIN_DELAY_MS);
      expect(observation?.screenshot).toBeInstanceOf(Uint8Array);
      expect(evidence.events).toHaveLength(1);
      expect(evidence.events[0]?.type).toBe('OBSERVATION');
      expect(evidence.events[0]?.executionId).toBe(execution.props.id);

      durations.push(observation?.durationMs ?? -1);
      evidenceCounts.push(evidence.events.length);
    }

    expect(durations).toHaveLength(3);
    expect(durations.every((duration) => duration >= EXPECTED_MIN_DELAY_MS)).toBe(true);
    expect(durations.every((duration) => Number.isFinite(duration))).toBe(true);
    expect(evidenceCounts).toEqual([1, 1, 1]);

    const serialized = JSON.stringify({ durations, evidenceCounts });
    expect(serialized).not.toContain('qualityScore');
    expect(serialized).not.toContain('globalDecision');
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
