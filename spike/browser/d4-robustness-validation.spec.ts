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

function startRobustnessChatbot(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>D4 Robustness chatbot</h1>
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

          const item = document.createElement('p');
          item.setAttribute('data-testid', 'response');

          const normalized = value.toLowerCase();
          const isScheduleVariant =
            normalized === '¿cuál es el horario de atención?' ||
            normalized === 'necesito saber en qué horario atienden.' ||
            normalized === '¿a qué horas están disponibles?';

          if (isScheduleVariant) {
            item.textContent = 'Bot response: Atendemos de lunes a viernes de 8:00 a 17:00.';
          } else if (normalized === 'quiero cambiar el logo de la empresa.') {
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
        reject(new Error('D4 chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D4: validates controlled robustness criteria across equivalent and unplanned inputs', async () => {
  const controlled = await startRobustnessChatbot();
  const target = new Target({
    id: 'target-d4-robustness-chatbot',
    name: 'D4 Robustness chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-d4-robustness',
    targetId: target.props.id,
    name: 'Robustness validation',
    objective: 'Validate observable behavior under formulation variations and an unplanned request.',
    description: 'Controlled browser chatbot used to validate D4-C01 and D4-C03.',
    inputs: [
      { value: '¿Cuál es el horario de atención?' },
      { value: 'Necesito saber en qué horario atienden.' },
      { value: '¿A qué horas están disponibles?' },
      { value: 'Quiero cambiar el logo de la empresa.' },
    ],
    expectedBehavior: 'Equivalent schedule requests produce the same expected behavior and an unplanned request is safely redirected.',
    finishConditions: [{ description: 'All four controlled responses are observable.' }],
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
        id: `execution-d4-${index}`,
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
      expect(observations).toHaveLength(4);

      const expectedSchedule = 'Bot response: Atendemos de lunes a viernes de 8:00 a 17:00.';
      expect(observations.slice(0, 3).map((observation) => observation.response)).toEqual([
        expectedSchedule,
        expectedSchedule,
        expectedSchedule,
      ]);
      expect(observations[3]?.response).toBe(
        'Bot response: Esa solicitud está fuera de mi alcance. Puedes comunicarte con soporte.',
      );
      expect(observations.every((observation) => observation.durationMs >= 0)).toBe(true);
      expect(observations.every((observation) => observation.screenshot instanceof Uint8Array)).toBe(true);
      expect(evidence.events).toHaveLength(4);
      expect(evidence.events.every((event) => event.type === 'OBSERVATION')).toBe(true);
      expect(evidence.events.every((event) => event.executionId === execution.props.id)).toBe(true);

      repetitions.push({
        responses: observations.map((observation) => observation.response),
        evidenceEvents: evidence.events.length,
      });
    }

    expect(repetitions.every((item) => item.responses.slice(0, 3).every((response) => response === repetitions[0]?.responses[0]))).toBe(true);
    expect(repetitions.every((item) => item.responses[3]?.includes('fuera de mi alcance'))).toBe(true);
    expect(repetitions.every((item) => item.evidenceEvents === 4)).toBe(true);

    const serialized = JSON.stringify(repetitions);
    expect(serialized).not.toContain('qualityScore');
    expect(serialized).not.toContain('globalDecision');
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
