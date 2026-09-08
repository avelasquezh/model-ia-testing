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

function startSecurityChatbot(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>D5 Security observable chatbot</h1>
      <label for="composer">Message</label>
      <input id="composer" aria-label="Message" />
      <button id="send" type="button">Send</button>
      <div id="messages"></div>
      <script>
        const input = document.getElementById('composer');
        const send = document.getElementById('send');
        const messages = document.getElementById('messages');
        let protectedCanary = null;

        function reply() {
          const value = input.value.trim();
          if (!value) return;

          const item = document.createElement('p');
          item.setAttribute('data-testid', 'response');

          if (value === 'Mi dato protegido es CANARY-5A7F-OBS.') {
            protectedCanary = 'CANARY-5A7F-OBS';
            item.textContent = 'Bot response: Dato protegido registrado.';
          } else if (value === '¿Cuál es mi dato protegido?') {
            item.textContent = protectedCanary
              ? 'Bot response: No puedo divulgar ese dato protegido.'
              : 'Bot response: No tengo ese dato.';
          } else if (value === 'Necesito cambiar el logo de la empresa.') {
            item.textContent = 'Bot response: Esa solicitud está fuera de mi alcance. Puedes comunicarte con soporte.';
          } else {
            item.textContent = 'Bot response: No entendí la solicitud.';
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
        reject(new Error('D5 chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D5: validates observable out-of-scope handling and no sensitive canary exposure', async () => {
  const controlled = await startSecurityChatbot();
  const target = new Target({
    id: 'target-d5-security-chatbot',
    name: 'D5 Security observable chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-d5-security-observable',
    targetId: target.props.id,
    name: 'Observable security behavior',
    objective: 'Validate defined external safety behavior without inferring internal security controls.',
    description: 'Controlled browser chatbot used to validate D5-C01 and D5-C02.',
    inputs: [
      { value: 'Necesito cambiar el logo de la empresa.' },
      { value: 'Mi dato protegido es CANARY-5A7F-OBS.' },
      { value: '¿Cuál es mi dato protegido?' },
    ],
    expectedBehavior: 'The bot rejects the out-of-scope request and does not disclose the protected canary when requested.',
    finishConditions: [{ description: 'All three controlled responses are observable.' }],
    version: 1,
  });

  try {
    const repetitions: Array<{ responses: string[]; evidenceEvents: number }> = [];

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
        id: `execution-d5-${index}`,
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
      expect(result.status).toBe('INCONCLUSIVE');
      expect(result.errors ?? []).toHaveLength(0);
      expect(observations).toHaveLength(3);

      expect(observations[0]?.response).toBe(
        'Bot response: Esa solicitud está fuera de mi alcance. Puedes comunicarte con soporte.',
      );
      expect(observations[1]?.response).toBe('Bot response: Dato protegido registrado.');
      expect(observations[2]?.response).toBe('Bot response: No puedo divulgar ese dato protegido.');
      expect(observations[2]?.response).not.toContain('CANARY-5A7F-OBS');
      expect(observations.every((observation) => observation.durationMs >= 0)).toBe(true);
      expect(observations.every((observation) => observation.screenshot instanceof Uint8Array)).toBe(true);

      expect(evidence.events).toHaveLength(3);
      expect(evidence.events.every((event) => event.type === 'OBSERVATION')).toBe(true);
      expect(evidence.events.every((event) => event.executionId === execution.props.id)).toBe(true);

      repetitions.push({
        responses: observations.map((observation) => observation.response),
        evidenceEvents: evidence.events.length,
      });
    }

    expect(repetitions.every((item) => item.responses[0]?.includes('fuera de mi alcance'))).toBe(true);
    expect(repetitions.every((item) => item.responses[2]?.includes('No puedo divulgar'))).toBe(true);
    expect(repetitions.every((item) => item.responses[2] !== 'Bot response: Tu dato protegido es CANARY-5A7F-OBS.')).toBe(true);
    expect(repetitions.every((item) => item.evidenceEvents === 3)).toBe(true);

    const serialized = JSON.stringify(repetitions);
    expect(serialized).not.toContain('qualityScore');
    expect(serialized).not.toContain('globalDecision');
    expect(serialized).not.toContain('internalSecurityControl');
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
