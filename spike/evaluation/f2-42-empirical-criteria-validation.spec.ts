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

function startControlledChatbot(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>Controlled chatbot</h1>
      <div id="messages" data-testid="responses"></div>
      <label for="composer">Message</label>
      <input id="composer" aria-label="Message" />
      <button id="send" type="button">Send</button>
      <script>
        const input = document.getElementById('composer');
        const send = document.getElementById('send');
        const messages = document.getElementById('messages');
        function reply() {
          const value = input.value.trim();
          if (!value) return;
          const item = document.createElement('p');
          item.setAttribute('data-testid', 'response');
          item.textContent = 'Bot response: ' + value;
          messages.appendChild(item);
          input.value = '';
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
        reject(new Error('Controlled chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('F2-42: empirically validates repeatable observable evidence for selected criteria', async () => {
  const controlled = await startControlledChatbot();
  const target = new Target({
    id: 'target-f2-42-controlled-chatbot',
    name: 'F2-42 Controlled chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-f2-42-controlled',
    targetId: target.props.id,
    name: 'Empirical observable response',
    objective: 'Validate reproducible observable evidence for functional response, timing and UI interaction.',
    description: 'Controlled browser chatbot used as an empirical evaluation target.',
    inputs: [{ value: 'Quiero una camisa azul talla M' }],
    expectedBehavior: 'A response containing the submitted message becomes visible after the message is sent.',
    finishConditions: [{ description: 'A bot response is visible in the conversation.' }],
    version: 1,
  });

  const browser = new PlaywrightBrowserAdapter();
  const uiConfigs: ConversationUiConfigRepository = new InMemoryUiConfigRepository({
    composer: { kind: 'label', value: 'Message' },
    sendButton: { kind: 'role', role: 'button', name: 'Send' },
    response: { kind: 'testId', value: 'response' },
    responseTimeoutMs: 5_000,
    pollIntervalMs: 50,
  });
  const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
  const runner = new PlaywrightExecutionRunner(conversation);

  try {
    const observations: Array<{ response: string; durationMs: number; screenshot: Uint8Array }> = [];
    for (const index of [1, 2, 3]) {
      const execution = new Execution({
        id: `execution-f2-42-${index}`,
        scenarioId: scenario.props.id,
        scenarioVersion: scenario.props.version,
        targetId: target.props.id,
        targetUrl: target.props.url,
        status: 'PENDING',
      }).start();

      const evidence = new RecordingEvidencePublisher();
      const executionRunner = new PlaywrightExecutionRunner(conversation, evidence);
      const result = await executionRunner.execute(
        { execution, scenario, target },
        { timeoutMs: 15_000 },
      );

      expect(result.status).toBe('INCONCLUSIVE');
      expect(result.errors ?? []).toHaveLength(0);
      expect(result.observations).toHaveLength(1);
      expect(result.observations?.[0]?.response).toContain('Quiero una camisa azul talla M');
      expect(result.observations?.[0]?.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.observations?.[0]?.screenshot).toBeInstanceOf(Uint8Array);
      expect(evidence.events).toHaveLength(1);
      expect(evidence.events[0]?.type).toBe('OBSERVATION');
      expect(evidence.events[0]?.executionId).toBe(execution.props.id);

      const observation = result.observations[0];
      if (!observation?.screenshot) {
        throw new Error(`Missing screenshot evidence for repetition ${index}`);
      }
      observations.push({
        response: observation.response,
        durationMs: observation.durationMs,
        screenshot: observation.screenshot,
      });
    }

    expect(observations.map((item) => item.response)).toEqual([
      'Bot response: Quiero una camisa azul talla M',
      'Bot response: Quiero una camisa azul talla M',
      'Bot response: Quiero una camisa azul talla M',
    ]);
    expect(observations.every((item) => item.durationMs >= 0)).toBe(true);
    expect(observations.every((item) => item.screenshot.length > 0)).toBe(true);

    // Empirical methodological result: D1 and D7 are reproducibly observable;
    // D6 is measurable under the declared timing protocol. No quality score is produced.
    expect(JSON.stringify(observations)).not.toContain('qualityScore');
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
