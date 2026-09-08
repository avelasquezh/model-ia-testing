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

function startContextAwareChatbot(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>F2-43 Context-aware chatbot</h1>
      <label for="composer">Message</label>
      <input id="composer" aria-label="Message" />
      <button id="send" type="button">Send</button>
      <div id="messages"></div>
      <script>
        const input = document.getElementById('composer');
        const send = document.getElementById('send');
        const messages = document.getElementById('messages');
        let favoriteColor = null;

        function reply() {
          const value = input.value.trim();
          if (!value) return;

          const item = document.createElement('p');
          item.setAttribute('data-testid', 'response');

          if (value.startsWith('Mi color favorito es ')) {
            favoriteColor = value.slice('Mi color favorito es '.length).trim();
            item.textContent = 'Bot response: Preferencia registrada.';
          } else if (value === '¿Cuál es mi color favorito?') {
            item.textContent = favoriteColor
              ? 'Bot response: Tu color favorito es ' + favoriteColor + '.'
              : 'Bot response: No tengo ese dato.';
          } else {
            item.textContent = 'Bot response: ' + value;
          }

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
        reject(new Error('Context-aware chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('F2-43: empirically validates conversational context retention across turns', async () => {
  const controlled = await startContextAwareChatbot();
  const target = new Target({
    id: 'target-f2-43-context-chatbot',
    name: 'F2-43 Context-aware chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-f2-43-context-retention',
    targetId: target.props.id,
    name: 'Context retention',
    objective: 'Verify that information established in one turn can be recovered in a later turn.',
    description: 'Controlled browser chatbot used to empirically validate D3-C01.',
    inputs: [
      { value: 'Mi color favorito es azul' },
      { value: '¿Cuál es mi color favorito?' },
    ],
    expectedBehavior: 'The second response recovers the color established in the first turn without repeating the color in the second input.',
    finishConditions: [{ description: 'The second bot response contains the previously established color.' }],
    version: 1,
  });

  try {
    const repetitions: Array<{ responses: string[]; screenshotBytes: number[] }> = [];

    for (const index of [1, 2, 3]) {
      const browser = new PlaywrightBrowserAdapter();
      const uiConfigs: ConversationUiConfigRepository = new InMemoryUiConfigRepository({
        composer: { kind: 'label', value: 'Message' },
        sendButton: { kind: 'role', role: 'button', name: 'Send' },
        response: { kind: 'testId', value: 'response' },
        responseTimeoutMs: 5_000,
        pollIntervalMs: 50,
      });
      const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
      const evidence = new RecordingEvidencePublisher();
      const runner = new PlaywrightExecutionRunner(conversation, evidence);
      const execution = new Execution({
        id: `execution-f2-43-${index}`,
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

      const observations = result.observations ?? [];
      const observationEvents = evidence.events.filter(
        (event): event is Extract<ExecutionEvidenceEvent, { readonly type: 'OBSERVATION' }> => event.type === 'OBSERVATION',
      );
      expect(result.status).toBe('INCONCLUSIVE');
      expect(result.errors ?? []).toHaveLength(0);
      expect(observations).toHaveLength(2);
      expect(observations[0]?.input).toBe('Mi color favorito es azul');
      expect(observations[0]?.response).toBe('Bot response: Preferencia registrada.');
      expect(observations[1]?.input).toBe('¿Cuál es mi color favorito?');
      expect(observations[1]?.input).not.toContain('azul');
      expect(observations[1]?.response).toBe('Bot response: Tu color favorito es azul.');
      expect(observations.every((observation) => observation.durationMs >= 0)).toBe(true);
      expect(observations.every((observation) => observation.screenshot instanceof Uint8Array)).toBe(true);

      expect(evidence.events).toHaveLength(2);
      expect(evidence.events.every((event) => event.type === 'OBSERVATION')).toBe(true);
      expect(evidence.events.every((event) => event.executionId === execution.props.id)).toBe(true);
      expect(observationEvents.map((event) => event.turnIndex)).toEqual([0, 1]);

      repetitions.push({
        responses: observations.map((observation) => observation.response),
        screenshotBytes: observations.map((observation) => observation.screenshot?.length ?? 0),
      });
    }

    expect(repetitions.map((item) => item.responses[1])).toEqual([
      'Bot response: Tu color favorito es azul.',
      'Bot response: Tu color favorito es azul.',
      'Bot response: Tu color favorito es azul.',
    ]);
    expect(repetitions.every((item) => item.screenshotBytes.every((bytes) => bytes > 0))).toBe(true);

    // Methodological result only: D3 is observed across turns; no product quality verdict is inferred.
    const serialized = JSON.stringify(repetitions);
    expect(serialized).not.toContain('qualityScore');
    expect(serialized).not.toContain('REGRESSION');
    expect(serialized).not.toContain('IMPROVEMENT');
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
