import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PlaywrightBrowserAdapter } from '../src/infrastructure/execution/playwright/PlaywrightBrowserAdapter.js';
import { PlaywrightConversationAdapter } from '../src/infrastructure/execution/playwright/PlaywrightConversationAdapter.js';
import { PlaywrightExecutionRunner } from '../src/infrastructure/execution/PlaywrightExecutionRunner.js';
import { LiveExecutionEvidencePublisher } from '../src/infrastructure/execution/LiveExecutionEvidencePublisher.js';
import { InMemoryConversationUiConfigRepository } from '../src/infrastructure/execution/playwright/InMemoryConversationUiConfigRepository.js';
import { classifyPublicSutFailure, type PublicSutFailureReason } from '../src/infrastructure/execution/playwright/PublicSutFailureClassification.js';
import { Execution } from '../src/domain/execution/Execution.js';
import { Scenario } from '../src/domain/scenario/Scenario.js';
import { Target } from '../src/domain/target/Target.js';
import type { ConversationUiConfig } from '../src/application/ports/ConversationUiConfigRepository.js';
import type { BotObservationSet } from '../src/domain/evaluation/BotObservation.js';
import type { ChatDiscoveryReport } from '../src/infrastructure/execution/playwright/ChatDiscoveryReport.js';

const CONFIG_FILE = process.env.BROWSER_SUT_CONFIG_FILE;
const OUTPUT_FILE = process.env.BROWSER_SUT_OUTPUT_FILE ?? 'artifacts/browser-sut/observations.json';
const DISCOVERY_REPORT_FILE = process.env.BROWSER_SUT_DISCOVERY_REPORT_FILE ?? 'artifacts/browser-sut/discovery.json';
const EVIDENCE_DIRECTORY = process.env.BROWSER_SUT_EVIDENCE_DIRECTORY ?? 'artifacts/browser-sut/evidence';
const TIMEOUT_MS = parsePositiveInteger(process.env.BROWSER_SUT_TIMEOUT_MS, 30_000, 'BROWSER_SUT_TIMEOUT_MS');

if (!CONFIG_FILE) {
  throw new Error('BROWSER_SUT_CONFIG_FILE is required');
}

const config = parseConfig(JSON.parse(await readFile(CONFIG_FILE, 'utf8')) as unknown);
const target = new Target(config.target);
const scenario = new Scenario({
  ...config.scenario,
  targetId: target.props.id,
});
const execution = new Execution({
  id: config.executionId ?? `browser-${randomUUID()}`,
  scenarioId: scenario.props.id,
  scenarioVersion: scenario.props.version,
  targetId: target.props.id,
  targetUrl: target.props.url,
  status: 'PENDING',
}).start();

const evidence = new LiveExecutionEvidencePublisher(EVIDENCE_DIRECTORY);
const browser = new PlaywrightBrowserAdapter();
const uiConfigs = config.ui
  ? new InMemoryConversationUiConfigRepository([{ targetUrl: target.props.url, config: config.ui }])
  : new InMemoryConversationUiConfigRepository();
const conversation = new PlaywrightConversationAdapter(browser, uiConfigs);
const runner = new PlaywrightExecutionRunner(conversation, evidence);
const result = await runner.execute({ execution, scenario, target }, { timeoutMs: TIMEOUT_MS });

const discoveryReport = conversation.getDiscoveryReport();
if (discoveryReport) {
  await writeFile(DISCOVERY_REPORT_FILE, JSON.stringify(withExecutionFailure(discoveryReport, result.errors ?? []), null, 2));
}

const observations: BotObservationSet = {
  schemaVersion: 'bot-observation-0.1',
  observations: (result.observations ?? []).map((observation, index) => ({
    caseId: scenario.props.id,
    conversationId: execution.props.id,
    repetition: config.repetition,
    turn: index + 1,
    userInput: observation.input,
    observedResponse: observation.response,
    expectedIntent: config.expectedIntent,
    expectedIntentVersion: config.expectedIntentVersion,
    evidenceIds: [`${execution.props.id}:turn-${String(index + 1).padStart(2, '0')}`],
    transport: 'browser',
    executionId: execution.props.id,
    observedAt: observation.observedAt.toISOString(),
  })),
};

await writeFile(OUTPUT_FILE, JSON.stringify(observations, null, 2));
console.log(JSON.stringify({
  status: result.status,
  executionId: execution.props.id,
  targetUrl: target.props.url,
  locatorMode: config.ui ? 'configured' : 'automatic-discovery',
  discoveryReportFile: discoveryReport ? DISCOVERY_REPORT_FILE : null,
  outputFile: OUTPUT_FILE,
  evidenceDirectory: EVIDENCE_DIRECTORY,
  observationCount: observations.observations.length,
  errors: result.errors ?? [],
}, null, 2));

function withExecutionFailure(report: ChatDiscoveryReport, errors: readonly { code: string; message: string; operation: string; turnIndex?: number }[]): ChatDiscoveryReport {
  const error = errors[0];
  if (!error) return report;
  const reason: PublicSutFailureReason = classifyPublicSutFailure(error);
  return {
    ...report,
    executionFailureReason: reason,
    executionError: {
      code: error.code,
      message: error.message,
      operation: error.operation,
      ...(error.turnIndex !== undefined ? { turnIndex: error.turnIndex } : {}),
    },
  };
}

function parseConfig(value: unknown): {
  target: { id: string; name: string; url: string; status: 'ACTIVE' | 'INACTIVE' };
  scenario: Omit<ConstructorParameters<typeof Scenario>[0], 'targetId'> & { targetId?: string };
  ui?: ConversationUiConfig;
  expectedIntent: string;
  expectedIntentVersion: string;
  repetition: number;
  executionId?: string;
} {
  if (!isRecord(value)) throw new Error('Browser SUT config must be a JSON object');

  const target = value.target;
  const scenario = value.scenario;
  const ui = value.ui;
  if (!isRecord(target) || !isRecord(scenario)) {
    throw new Error('Browser SUT config requires target and scenario objects');
  }

  if (typeof target.id !== 'string' || typeof target.name !== 'string' || typeof target.url !== 'string') {
    throw new Error('Browser SUT target requires string id, name and url');
  }
  if (target.status !== undefined && target.status !== 'ACTIVE' && target.status !== 'INACTIVE') {
    throw new Error('Browser SUT target status must be ACTIVE or INACTIVE');
  }
  if (!Array.isArray(scenario.inputs) || scenario.inputs.length === 0) {
    throw new Error('Browser SUT scenario requires at least one input');
  }
  if (typeof scenario.id !== 'string' || typeof scenario.name !== 'string' || typeof scenario.objective !== 'string' ||
      typeof scenario.description !== 'string' || typeof scenario.expectedBehavior !== 'string' ||
      !Array.isArray(scenario.finishConditions) || typeof scenario.version !== 'number') {
    throw new Error('Browser SUT scenario is missing required fields');
  }
  if (scenario.inputs.some((input) => !isRecord(input) || typeof input.value !== 'string' || !input.value.trim())) {
    throw new Error('Browser SUT scenario inputs must contain non-empty string values');
  }
  if (scenario.finishConditions.some((condition) => !isRecord(condition) || typeof condition.description !== 'string' || !condition.description.trim())) {
    throw new Error('Browser SUT finish conditions must contain descriptions');
  }
  if (!Number.isInteger(scenario.version) || scenario.version < 1) {
    throw new Error('Browser SUT scenario version must be a positive integer');
  }
  if (typeof value.expectedIntent !== 'string' || !value.expectedIntent.trim()) {
    throw new Error('Browser SUT expectedIntent is required');
  }
  if (typeof value.expectedIntentVersion !== 'string' || !value.expectedIntentVersion.trim()) {
    throw new Error('Browser SUT expectedIntentVersion is required');
  }
  const repetition = value.repetition === undefined ? 1 : value.repetition;
  if (!Number.isInteger(repetition) || repetition < 1) {
    throw new Error('Browser SUT repetition must be a positive integer');
  }

  if (ui !== undefined) {
    if (!isRecord(ui)) throw new Error('Browser SUT ui must be an object when supplied');
    validateUiConfig(ui);
  }

  return {
    target: {
      id: target.id,
      name: target.name,
      url: target.url,
      status: (target.status as 'ACTIVE' | 'INACTIVE' | undefined) ?? 'ACTIVE',
    },
    scenario: scenario as Omit<ConstructorParameters<typeof Scenario>[0], 'targetId'> & { targetId?: string },
    ...(ui ? { ui: ui as ConversationUiConfig } : {}),
    expectedIntent: value.expectedIntent,
    expectedIntentVersion: value.expectedIntentVersion,
    repetition,
    ...(typeof value.executionId === 'string' && value.executionId.trim() ? { executionId: value.executionId } : {}),
  };
}

function validateUiConfig(ui: Record<string, unknown>): void {
  for (const field of ['composer', 'response']) {
    if (!isRecord(ui[field])) throw new Error(`Browser SUT ui.${field} is required`);
    validateLocator(ui[field] as Record<string, unknown>, `ui.${field}`);
  }
  if (ui.sendButton !== undefined) {
    if (!isRecord(ui.sendButton)) throw new Error('Browser SUT ui.sendButton must be an object');
    validateLocator(ui.sendButton, 'ui.sendButton');
  }
  for (const field of ['responseTimeoutMs', 'pollIntervalMs']) {
    if (ui[field] !== undefined && (!Number.isInteger(ui[field]) || (ui[field] as number) <= 0)) {
      throw new Error(`Browser SUT ${field} must be a positive integer`);
    }
  }
}

function validateLocator(locator: Record<string, unknown>, path: string): void {
  const allowedKinds = ['role', 'label', 'placeholder', 'testId', 'css'];
  if (typeof locator.kind !== 'string' || !allowedKinds.includes(locator.kind)) {
    throw new Error(`${path}.kind must be one of role, label, placeholder, testId, css`);
  }
  if (locator.kind === 'role' && typeof locator.role !== 'string') {
    throw new Error(`${path}.role is required for role locators`);
  }
  if (locator.kind !== 'role' && (typeof locator.value !== 'string' || !locator.value.trim())) {
    throw new Error(`${path}.value is required for ${locator.kind} locators`);
  }
  if (locator.name !== undefined && typeof locator.name !== 'string') {
    throw new Error(`${path}.name must be a string`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePositiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}
