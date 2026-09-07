import { createServer, type Server } from 'node:http';
import { test, expect } from '@playwright/test';
import { PlaywrightBrowserAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';
import { PlaywrightConversationAdapter } from '../../src/infrastructure/execution/playwright/PlaywrightConversationAdapter.js';
import { PlaywrightExecutionRunner } from '../../src/infrastructure/execution/PlaywrightExecutionRunner.js';
import { Execution } from '../../src/domain/execution/Execution.js';
import { Scenario } from '../../src/domain/scenario/Scenario.js';
import { Target } from '../../src/domain/target/Target.js';
import { Criterion } from '../../src/domain/evaluation/Criterion.js';
import { ComposeEvaluationPlan, type CriterionCatalog } from '../../src/application/evaluation/ComposeEvaluationPlan.js';
import { EvaluateCriterion } from '../../src/application/evaluation/EvaluateCriterion.js';
import { ExactExpectedResponseRule } from '../../src/application/evaluation/ExactExpectedResponseRule.js';
import { InMemoryEvidenceCatalog } from '../../src/infrastructure/evaluation/InMemoryEvidenceCatalog.js';
import type { ConversationUiConfigRepository } from '../../src/application/ports/ConversationUiConfigRepository.js';
import type { EvaluationEvidence } from '../../src/application/ports/EvidenceCatalog.js';
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

class InMemoryCriterionCatalog implements CriterionCatalog {
  public constructor(private readonly criteria: readonly Criterion[]) {}

  public async findAll(): Promise<readonly Criterion[]> {
    return this.criteria;
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

test('F2-21: evaluates a captured chatbot response with a deterministic observable rule', async () => {
  const controlled = await startControlledChatbot();
  const input = 'Quiero una camisa azul talla M';
  const expectedResponse = `Bot response: ${input}`;
  const target = new Target({
    id: 'target-controlled-chatbot',
    name: 'Controlled chatbot',
    url: controlled.url,
    status: 'ACTIVE',
  });
  const scenario = new Scenario({
    id: 'scenario-controlled-chatbot',
    targetId: target.props.id,
    name: 'Echo conversation evaluation',
    objective: 'Verify the chatbot response against an observable expected response',
    description: 'Controlled browser chatbot used as an executable deterministic evaluation target.',
    inputs: [{ value: input }],
    expectedBehavior: expectedResponse,
    finishConditions: [{ description: 'A bot response is visible in the conversation.' }],
    version: 1,
  });
  const execution = new Execution({
    id: 'execution-f2-21-001',
    scenarioId: scenario.props.id,
    scenarioVersion: scenario.props.version,
    targetId: target.props.id,
    targetUrl: target.props.url,
    status: 'PENDING',
  }).start();

  const browser = new PlaywrightBrowserAdapter();
  const uiConfigs: ConversationUiConfigRepository = new InMemoryUiConfigRepository({
    composer: { kind: 'label', value: 'Message' },
    sendButton: { kind: 'role', role: 'button', name: 'Send' },
    response: { kind: 'testId', value: 'response' },
    responseTimeoutMs: 5_000,
    pollIntervalMs: 50,
  });
  const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
  const publisher = new RecordingEvidencePublisher();
  const runner = new PlaywrightExecutionRunner(conversation, publisher);
  const criterion = new Criterion({
    id: 'D1-C01',
    dimensionId: 'D1',
    type: 'BOOLEAN',
    applicableContexts: ['web-chatbot'],
    requiredEvidence: ['TRANSCRIPT', 'SCREENSHOT'],
    ruleVersion: 'rule-exact-response-v1',
  });

  try {
    const result = await runner.execute(
      { execution, scenario, target },
      { timeoutMs: 15_000 },
    );

    expect(result.status).toBe('INCONCLUSIVE');
    expect(result.observations).toHaveLength(1);
    const observation = result.observations?.[0];
    expect(observation?.response).toBe(expectedResponse);
    expect(observation?.screenshot).toBeInstanceOf(Uint8Array);
    expect(publisher.events).toHaveLength(1);

    const transcriptEvidence: EvaluationEvidence = {
      id: 'e-f2-21-transcript-1',
      executionId: execution.props.id,
      evidenceType: 'TRANSCRIPT',
      contentReference: JSON.stringify({ input: observation?.input, response: observation?.response }),
    };
    const screenshotEvidence: EvaluationEvidence = {
      id: 'e-f2-21-screenshot-1',
      executionId: execution.props.id,
      evidenceType: 'SCREENSHOT',
      contentReference: `memory://${execution.props.id}/turn-0.png`,
    };
    const evidenceCatalog = new InMemoryEvidenceCatalog([transcriptEvidence, screenshotEvidence]);
    const plan = await new ComposeEvaluationPlan(new InMemoryCriterionCatalog([criterion])).compose({
      executionId: execution.props.id,
      context: 'web-chatbot',
    });
    const evaluator = new EvaluateCriterion(
      evidenceCatalog,
      new Map([
        [criterion.props.id, new ExactExpectedResponseRule(criterion.props.ruleVersion, expectedResponse)],
      ]),
    );

    const evaluation = await evaluator.evaluate({
      executionId: execution.props.id,
      plan,
      criterionId: criterion.props.id,
    });

    expect(evaluation.props.status).toBe('PASS');
    expect(evaluation.props.criterionId).toBe('D1-C01');
    expect(evaluation.props.executionId).toBe(execution.props.id);
    expect(evaluation.props.evidenceId).toBe(transcriptEvidence.id);
    expect(evaluation.props.rule).toBe(criterion.props.ruleVersion);
  } finally {
    await new Promise<void>((resolve, reject) => controlled.server.close((error) => (error ? reject(error) : resolve())));
  }
});
