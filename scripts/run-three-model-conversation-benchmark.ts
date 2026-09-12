import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { AdaptiveDiscoveryExperimentRunner } from '../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryExperimentRunner.js';
import { verifyAdaptiveV2NetworkConversation } from '../src/infrastructure/execution/playwright/discovery/AdaptiveV2NetworkVerification.js';
import { PlaywrightChatDiscovery } from '../src/infrastructure/execution/playwright/PlaywrightChatDiscovery.js';
import { PlaywrightConversationUi } from '../src/infrastructure/execution/playwright/PlaywrightConversationUi.js';

type Target = { readonly id: string; readonly name: string; readonly url: string; readonly status?: string };
type Model = 'LEGACY' | 'ADAPTIVE' | 'ADAPTIVE_V2_NETWORK';
type Result = {
  readonly model: Model;
  readonly targetId: string;
  readonly targetUrl: string;
  readonly discovery: 'FOUND' | 'NOT_FOUND' | 'ERROR';
  readonly chatOpen: 'FOUND' | 'NOT_FOUND' | 'ERROR';
  readonly composer: 'FOUND' | 'NOT_FOUND' | 'ERROR';
  readonly send: 'CONFIRMED' | 'FAILED' | 'NOT_PERFORMED';
  readonly receive: 'CONFIRMED' | 'FAILED' | 'NOT_PERFORMED';
  readonly conversation: 'VERIFIED' | 'FAILED' | 'NOT_PERFORMED';
  readonly networkOutbound?: boolean;
  readonly networkInbound?: boolean;
  readonly networkOrdered?: boolean;
  readonly domResponseObserved?: boolean;
  readonly durationMs: number;
  readonly error?: string;
};

const corpusFile = process.env.THREE_MODEL_CORPUS_FILE ?? 'examples/public-sut-discovery-corpus.json';
const outputFile = process.env.THREE_MODEL_OUTPUT_FILE ?? 'artifacts/browser-sut/three-model-conversation-benchmark.json';
const timeoutMs = positive(process.env.THREE_MODEL_TIMEOUT_MS, 45_000, 'THREE_MODEL_TIMEOUT_MS');
const message = process.env.THREE_MODEL_MESSAGE ?? 'Hello';
const adaptiveMaxCandidates = positive(process.env.ADAPTIVE_DISCOVERY_MAX_CANDIDATES, 80, 'ADAPTIVE_DISCOVERY_MAX_CANDIDATES');
const adaptiveMaxClicks = positive(process.env.ADAPTIVE_DISCOVERY_MAX_CLICKS, 24, 'ADAPTIVE_DISCOVERY_MAX_CLICKS');

const corpus = parseCorpus(JSON.parse(await readFile(corpusFile, 'utf8')) as unknown);
const browser = await chromium.launch({ headless: true });
const results: Result[] = [];

try {
  for (const target of corpus.targets) {
    for (const model of ['LEGACY', 'ADAPTIVE', 'ADAPTIVE_V2_NETWORK'] as const) {
      results.push(await runTarget(browser, target, model));
    }
  }

  const report = buildReport(results);
  await mkdir(outputFile.split('/').slice(0, -1).join('/') || '.', { recursive: true });
  await writeFile(outputFile, JSON.stringify({
    generatedAt: new Date().toISOString(),
    corpusFile,
    message,
    targetCount: corpus.targets.length,
    models: ['LEGACY', 'ADAPTIVE', 'ADAPTIVE_V2_NETWORK'],
    comparison: report,
    results,
  }, null, 2));

  console.log(JSON.stringify({ outputFile, targetCount: corpus.targets.length, comparison: report }, null, 2));
} finally {
  await browser.close();
}

async function runTarget(browserInstance: typeof browser, target: Target, model: Model): Promise<Result> {
  const startedAt = Date.now();
  const context = await browserInstance.newContext();
  const page = await context.newPage();
  try {
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    if (model === 'LEGACY') return await runLegacy(page, target, startedAt);
    return await runAdaptive(page, target, startedAt, model === 'ADAPTIVE_V2_NETWORK');
  } catch (error) {
    return baseResult(model, target, startedAt, {
      discovery: 'ERROR', chatOpen: 'ERROR', composer: 'ERROR', send: 'NOT_PERFORMED', receive: 'NOT_PERFORMED', conversation: 'NOT_PERFORMED',
      error: messageOf(error),
    });
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function runLegacy(page: import('@playwright/test').Page, target: Target, startedAt: number): Promise<Result> {
  try {
    const discovery = await new PlaywrightChatDiscovery(page).discoverWithEvidence();
    const ui = new PlaywrightConversationUi(page, discovery.config);
    try {
      await ui.sendMessage(message, timeoutMs);
      return baseResult('LEGACY', target, startedAt, { discovery: 'FOUND', chatOpen: 'FOUND', composer: 'FOUND', send: 'CONFIRMED', receive: 'CONFIRMED', conversation: 'VERIFIED' });
    } catch (error) {
      return baseResult('LEGACY', target, startedAt, { discovery: 'FOUND', chatOpen: 'FOUND', composer: 'FOUND', send: 'CONFIRMED', receive: 'FAILED', conversation: 'FAILED', error: messageOf(error) });
    }
  } catch (error) {
    return baseResult('LEGACY', target, startedAt, { discovery: 'NOT_FOUND', chatOpen: 'NOT_FOUND', composer: 'NOT_FOUND', send: 'NOT_PERFORMED', receive: 'NOT_PERFORMED', conversation: 'NOT_PERFORMED', error: messageOf(error) });
  }
}

async function runAdaptive(page: import('@playwright/test').Page, target: Target, startedAt: number, networkMode: boolean): Promise<Result> {
  try {
    const adaptive = await new AdaptiveDiscoveryExperimentRunner(page, {
      maxCandidates: adaptiveMaxCandidates,
      maxClicks: adaptiveMaxClicks,
      settleMs: 650,
      isolateExperiments: true,
    }).run();
    if (!adaptive.selected) {
      return baseResult(networkMode ? 'ADAPTIVE_V2_NETWORK' : 'ADAPTIVE', target, startedAt, { discovery: 'NOT_FOUND', chatOpen: 'NOT_FOUND', composer: 'NOT_FOUND', send: 'NOT_PERFORMED', receive: 'NOT_PERFORMED', conversation: 'NOT_PERFORMED' });
    }

    const discovery = await new PlaywrightChatDiscovery(page).discoverWithEvidence();
    if (!networkMode) {
      const ui = new PlaywrightConversationUi(page, discovery.config);
      try {
        await ui.sendMessage(message, timeoutMs);
        return baseResult('ADAPTIVE', target, startedAt, { discovery: 'FOUND', chatOpen: 'FOUND', composer: 'FOUND', send: 'CONFIRMED', receive: 'CONFIRMED', conversation: 'VERIFIED' });
      } catch (error) {
        return baseResult('ADAPTIVE', target, startedAt, { discovery: 'FOUND', chatOpen: 'FOUND', composer: 'FOUND', send: 'CONFIRMED', receive: 'FAILED', conversation: 'FAILED', error: messageOf(error) });
      }
    }

    const verification = await verifyAdaptiveV2NetworkConversation(page, discovery.config, message, timeoutMs);
    return baseResult('ADAPTIVE_V2_NETWORK', target, startedAt, {
      discovery: 'FOUND', chatOpen: 'FOUND', composer: 'FOUND', send: verification.send, receive: verification.receive, conversation: verification.conversation,
      networkOutbound: verification.network.outbound, networkInbound: verification.network.inbound, networkOrdered: verification.network.ordered,
      domResponseObserved: verification.domResponseObserved, ...(verification.error ? { error: verification.error } : {}),
    });
  } catch (error) {
    return baseResult(networkMode ? 'ADAPTIVE_V2_NETWORK' : 'ADAPTIVE', target, startedAt, { discovery: 'FOUND', chatOpen: 'ERROR', composer: 'ERROR', send: 'NOT_PERFORMED', receive: 'NOT_PERFORMED', conversation: 'NOT_PERFORMED', error: messageOf(error) });
  }
}

function baseResult(model: Model, target: Target, startedAt: number, value: Omit<Result, 'model' | 'targetId' | 'targetUrl' | 'durationMs'>): Result {
  return { model, targetId: target.id, targetUrl: target.url, durationMs: Date.now() - startedAt, ...value };
}

function buildReport(resultsSet: readonly Result[]) {
  const models = ['LEGACY', 'ADAPTIVE', 'ADAPTIVE_V2_NETWORK'] as const;
  return Object.fromEntries(models.map((model) => {
    const rows = resultsSet.filter((result) => result.model === model);
    const rate = (predicate: (result: Result) => boolean): number => rows.length === 0 ? 0 : Number((rows.filter(predicate).length / rows.length).toFixed(4));
    return [model, {
      targetCount: rows.length,
      discoveryRate: rate((row) => row.discovery === 'FOUND'),
      chatOpenRate: rate((row) => row.chatOpen === 'FOUND'),
      composerRate: rate((row) => row.composer === 'FOUND'),
      sendRate: rate((row) => row.send === 'CONFIRMED'),
      receiveRate: rate((row) => row.receive === 'CONFIRMED'),
      verifiedRate: rate((row) => row.conversation === 'VERIFIED'),
      networkOutboundRate: rate((row) => row.networkOutbound === true),
      networkInboundRate: rate((row) => row.networkInbound === true),
      networkOrderedRate: rate((row) => row.networkOrdered === true),
      domResponseRate: rate((row) => row.domResponseObserved === true),
    }];
  }));
}

function parseCorpus(value: unknown): { targets: Target[] } {
  if (!isRecord(value) || !Array.isArray(value.targets) || value.targets.length === 0) throw new Error('Corpus requires a non-empty targets array');
  return { targets: value.targets.map((target, index) => {
    if (!isRecord(target) || typeof target.id !== 'string' || typeof target.name !== 'string' || typeof target.url !== 'string' || !/^https?:\/\//i.test(target.url)) {
      throw new Error(`Invalid target at index ${index}`);
    }
    return { id: target.id, name: target.name, url: target.url, ...(typeof target.status === 'string' ? { status: target.status } : {}) };
  }) };
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function positive(value: string | undefined, fallback: number, name: string): number { const parsed = value === undefined ? fallback : Number(value); if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`); return parsed; }
function messageOf(error: unknown): string { return error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
