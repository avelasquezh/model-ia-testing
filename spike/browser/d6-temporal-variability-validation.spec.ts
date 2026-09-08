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

const CONTROLLED_DELAYS_MS = [80, 120, 160] as const;
const EXPECTED_RESPONSE = 'Bot response: Solicitud procesada.';

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

function startVariableDelayChatbot(): Promise<{ server: Server; url: string }> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(`<!doctype html>
<html>
  <body>
    <main>
      <h1>D6 Temporal variability observable chatbot</h1>
      <label for="composer">Message</label>
      <input id="composer" aria-label="Message" />
      <button id="send" type="button">Send</button>
      <div id="messages"></div>
      <script>
        const input = document.getElementById('composer');
        const send = document.getElementById('send');
        const messages = document.getElementById('messages');
        const delay = Number(new URLSearchParams(window.location.search).get('delayMs') ?? '0');

        function reply() {
          const value = input.value.trim();
          if (!value) return;

          window.setTimeout(() => {
            const item = document.createElement('p');
            item.setAttribute('data-testid', 'response');
            item.textContent = '${EXPECTED_RESPONSE}';
            messages.appendChild(item);
            input.value = '';
          }, delay);
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
        reject(new Error('D6 temporal variability chatbot server did not expose a port'));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('D6-C02: describes temporal variability across comparable observable executions', async () => {
  const controlled = await startVariableDelayChatbot();
  const target = new Target({
    id: 'target-d6-temporal-variability-chatbot',
    name: 'D6 Temporal variability observable chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-d6-temporal-variability',
    targetId: target.props.id,
    name: 'Observable temporal variability',
    objective: 'Describe elapsed-time variability across comparable observable executions.',
    description: 'Controlled browser chatbot used to validate D6-C02.',
    inputs: [{ value: 'Consulta de prueba de variabilidad temporal.' }],
    expectedBehavior: 'A response becomes observable after a controlled delay that can be measured externally.',
    finishConditions: [{ description: 'The first response is observable.' }],
    version: 1,
  });

  try {
    const durations: number[] = [];
    const evidenceCounts: number[] = [];

    for (const index of [0, 1, 2]) {
      const expectedDelay = CONTROLLED_DELAYS_MS[index];
      expect(expectedDelay).toBeDefined();
      const executionTarget = new Target({
        id: target.props.id,
        name: target.props.name,
        url: `${controlled.url}?delayMs=${expectedDelay}`,
        status: 'ACTIVE',
      });
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
        id: `execution-d6-c02-${index + 1}`,
        scenarioId: scenario.props.id,
        scenarioVersion: scenario.props.version,
        targetId: executionTarget.props.id,
        targetUrl: executionTarget.props.url,
        status: 'PENDING',
      }).start();

      const result = await runner.execute(
        { execution, scenario, target: executionTarget },
        { timeoutMs: 15_000 },
      );

      const observation = result.observations?.[0];
      expect(result.status).toBe('INCONCLUSIVE');
      expect(result.errors ?? []).toHaveLength(0);
      expect(observation?.response).toBe(EXPECTED_RESPONSE);
      expect(observation?.durationMs).toBeGreaterThanOrEqual(expectedDelay ?? 0);
      expect(observation?.screenshot).toBeInstanceOf(Uint8Array);
      expect(evidence.events).toHaveLength(1);
      expect(evidence.events[0]?.type).toBe('OBSERVATION');
      expect(evidence.events[0]?.executionId).toBe(execution.props.id);

      durations.push(observation?.durationMs ?? -1);
      evidenceCounts.push(evidence.events.length);
    }

    expect(durations).toHaveLength(CONTROLLED_DELAYS_MS.length);
    expect(durations.every((duration) => Number.isFinite(duration))).toBe(true);
    expect(durations.every((duration, index) => duration >= (CONTROLLED_DELAYS_MS[index] ?? Number.POSITIVE_INFINITY))).toBe(true);
    expect(evidenceCounts).toEqual([1, 1, 1]);

    const minimum = Math.min(...durations);
    const maximum = Math.max(...durations);
    const rangeMs = maximum - minimum;
    const meanMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    const populationVarianceMs2 = durations.reduce((sum, duration) => sum + (duration - meanMs) ** 2, 0) / durations.length;
    const populationStandardDeviationMs = Math.sqrt(populationVarianceMs2);

    expect(rangeMs).toBeGreaterThanOrEqual(80);
    expect(meanMs).toBeGreaterThanOrEqual(minimum);
    expect(meanMs).toBeLessThanOrEqual(maximum);
    expect(populationVarianceMs2).toBeGreaterThanOrEqual(0);
    expect(populationStandardDeviationMs).toBeGreaterThanOrEqual(0);

    const serialized = JSON.stringify({
      durations,
      minimum,
      maximum,
      rangeMs,
      meanMs,
      populationVarianceMs2,
      populationStandardDeviationMs,
      evidenceCounts,
    });
    expect(serialized).not.toContain('qualityScore');
    expect(serialized).not.toContain('globalDecision');
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
