import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, type Browser } from '@playwright/test';
import { AdaptiveDiscoveryExperimentRunner } from '../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryExperimentRunner.js';
import { LegacySeededAdaptiveDiscovery } from '../src/infrastructure/execution/playwright/discovery/LegacySeededAdaptiveDiscovery.js';
import { ChatDiscoveryError, PlaywrightChatDiscovery } from '../src/infrastructure/execution/playwright/PlaywrightChatDiscovery.js';
import type { ChatDiscoveryReport } from '../src/infrastructure/execution/playwright/ChatDiscoveryReport.js';

type Target = { readonly id: string; readonly name: string; readonly url: string; readonly status?: string };
type Corpus = { readonly targets: readonly Target[] };
type ModelName = 'LEGACY' | 'ADAPTIVE' | 'LEGACY_SEEDED_ADAPTIVE';
type ModelResult = { readonly model: ModelName; readonly ok: boolean; readonly chatSurfaceFound: boolean; readonly candidatesConsidered?: number; readonly seedsConsidered?: number; readonly clicksAttempted?: number; readonly experiments?: number; readonly durationMs: number; readonly error?: string };
type TargetResult = { readonly id: string; readonly name: string; readonly url: string; readonly results: readonly ModelResult[] };
type Report = {
  readonly schemaVersion: 'discovery-three-model-evidence-0.1';
  readonly generatedAt: string;
  readonly experimentalBoundary: { readonly sendReceive: 'NOT_PERFORMED'; readonly note: string };
  readonly targets: readonly TargetResult[];
  readonly summary: Record<ModelName, { readonly targetCount: number; readonly executionOk: number; readonly chatSurfaceFound: number; readonly chatSurfaceRate: number; readonly clicksAttempted: number }>;
};

const corpusFile = process.env.DISCOVERY_BENCHMARK_CORPUS_FILE ?? 'examples/public-sut-discovery-corpus.json';
const outputFile = process.env.DISCOVERY_THREE_MODEL_OUTPUT_FILE ?? 'artifacts/browser-sut/discovery-three-model-evidence.json';
const timeoutMs = Number.parseInt(process.env.DISCOVERY_BENCHMARK_TIMEOUT_MS ?? '30000', 10);
const settleMs = Number.parseInt(process.env.ADAPTIVE_DISCOVERY_SETTLE_MS ?? '350', 10);
const maxCandidates = Number.parseInt(process.env.ADAPTIVE_DISCOVERY_MAX_CANDIDATES ?? '40', 10);
const maxClicks = Number.parseInt(process.env.ADAPTIVE_DISCOVERY_MAX_CLICKS ?? '12', 10);

async function main(): Promise<void> {
  const corpus = JSON.parse(await readFile(corpusFile, 'utf8')) as Corpus;
  const browser = await chromium.launch({ headless: true });
  try {
    const targets: TargetResult[] = [];
    for (const target of corpus.targets) targets.push(await runTarget(browser, target));
    const models: readonly ModelName[] = ['LEGACY', 'ADAPTIVE', 'LEGACY_SEEDED_ADAPTIVE'];
    const summary = Object.fromEntries(models.map((model) => {
      const results = targets.flatMap((target) => target.results.filter((result) => result.model === model));
      const executionOk = results.filter((result) => result.ok).length;
      const chatSurfaceFound = results.filter((result) => result.chatSurfaceFound).length;
      return [model, { targetCount: results.length, executionOk, chatSurfaceFound, chatSurfaceRate: results.length === 0 ? 0 : Number((chatSurfaceFound / results.length * 100).toFixed(1)), clicksAttempted: results.reduce((sum, result) => sum + (result.clicksAttempted ?? 0), 0) }];
    })) as Record<ModelName, { targetCount: number; executionOk: number; chatSurfaceFound: number; chatSurfaceRate: number; clicksAttempted: number }>;
    const report: Report = {
      schemaVersion: 'discovery-three-model-evidence-0.1',
      generatedAt: new Date().toISOString(),
      experimentalBoundary: { sendReceive: 'NOT_PERFORMED', note: 'Three discovery models are compared independently on fresh browser contexts. No composer input, SEND action or RECEIVE verification is performed.' },
      targets,
      summary,
    };
    const directory = outputFile.includes('/') ? outputFile.slice(0, outputFile.lastIndexOf('/')) : '.';
    await mkdir(directory, { recursive: true });
    await writeFile(outputFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify(summary, null, 2));
  } finally { await browser.close(); }
}

async function runTarget(browser: Browser, target: Target): Promise<TargetResult> {
  return {
    id: target.id,
    name: target.name,
    url: target.url,
    results: [
      await runLegacy(browser, target),
      await runAdaptive(browser, target),
      await runHybrid(browser, target),
    ],
  };
}

async function runLegacy(browser: Browser, target: Target): Promise<ModelResult> {
  const context = await browser.newContext(); const page = await context.newPage(); const started = Date.now();
  try {
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    const discovery = await new PlaywrightChatDiscovery(page).discoverWithEvidence();
    return legacyResult(discovery.report, Date.now() - started);
  } catch (error) {
    const report = error instanceof ChatDiscoveryError ? error.report : undefined;
    return report ? legacyResult(report, Date.now() - started, errorMessage(error)) : { model: 'LEGACY', ok: false, chatSurfaceFound: false, durationMs: Date.now() - started, error: errorMessage(error) };
  } finally { await context.close(); }
}

async function runAdaptive(browser: Browser, target: Target): Promise<ModelResult> {
  const context = await browser.newContext(); const page = await context.newPage(); const started = Date.now();
  try {
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    const run = await new AdaptiveDiscoveryExperimentRunner(page, { maxCandidates, maxClicks, settleMs }).run();
    return { model: 'ADAPTIVE', ok: true, chatSurfaceFound: Boolean(run.selected), candidatesConsidered: run.candidatesConsidered, clicksAttempted: run.clicksAttempted, experiments: run.experiments.length, durationMs: Date.now() - started };
  } catch (error) {
    return { model: 'ADAPTIVE', ok: false, chatSurfaceFound: false, durationMs: Date.now() - started, error: errorMessage(error) };
  } finally { await context.close(); }
}

async function runHybrid(browser: Browser, target: Target): Promise<ModelResult> {
  const context = await browser.newContext(); const page = await context.newPage(); const started = Date.now();
  try {
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    const run = await new LegacySeededAdaptiveDiscovery(page, { maxSeeds: maxCandidates, maxClicks, settleMs }).run();
    return { model: 'LEGACY_SEEDED_ADAPTIVE', ok: true, chatSurfaceFound: Boolean(run.selected), seedsConsidered: run.seedsConsidered, clicksAttempted: run.clicksAttempted, experiments: run.experiments.length, durationMs: Date.now() - started };
  } catch (error) {
    return { model: 'LEGACY_SEEDED_ADAPTIVE', ok: false, chatSurfaceFound: false, durationMs: Date.now() - started, error: errorMessage(error) };
  } finally { await context.close(); }
}

function legacyResult(report: ChatDiscoveryReport, durationMs: number, error?: string): ModelResult {
  return { model: 'LEGACY', ok: report.status === 'DISCOVERED' || report.candidates.length > 0, chatSurfaceFound: report.status === 'DISCOVERED', candidatesConsidered: report.candidates.length, durationMs, ...(error ? { error } : {}) };
}

function errorMessage(error: unknown): string { return error instanceof Error ? `${error.name}: ${error.message}` : String(error); }

await main();
