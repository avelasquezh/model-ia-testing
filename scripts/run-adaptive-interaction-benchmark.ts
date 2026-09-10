import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { AdaptiveDiscoveryExperimentRunner } from '../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryExperimentRunner.js';
import { verifyAdaptiveInteraction, type AdaptiveInteractionVerification } from '../src/infrastructure/execution/playwright/discovery/AdaptiveInteractionVerification.js';

type Target = { readonly id: string; readonly name: string; readonly url: string; readonly status?: string };
type TargetResult = {
  readonly targetId: string;
  readonly targetUrl: string;
  readonly discovery: 'CHAT_SURFACE_FOUND' | 'CANDIDATE_FOUND' | 'NOT_FOUND' | 'ERROR';
  readonly clicksAttempted: number;
  readonly durationMs: number;
  readonly interaction?: AdaptiveInteractionVerification;
  readonly error?: string;
};

type Report = {
  readonly schemaVersion: 'adaptive-interaction-benchmark-0.1';
  readonly generatedAt: string;
  readonly corpusFile: string;
  readonly probeMessage: string;
  readonly targetCount: number;
  readonly selectedCount: number;
  readonly verifiedCount: number;
  readonly results: readonly TargetResult[];
};

const corpusFile = process.env.DISCOVERY_BENCHMARK_CORPUS_FILE ?? 'examples/public-sut-discovery-corpus.json';
const outputFile = process.env.ADAPTIVE_INTERACTION_OUTPUT_FILE ?? 'artifacts/browser-sut/adaptive-interaction-benchmark.json';
const evidenceDirectory = process.env.ADAPTIVE_INTERACTION_EVIDENCE_DIRECTORY ?? 'artifacts/browser-sut/adaptive-interaction';
const timeoutMs = parsePositiveInteger(process.env.DISCOVERY_BENCHMARK_TIMEOUT_MS, 30_000, 'DISCOVERY_BENCHMARK_TIMEOUT_MS');
const verificationTimeoutMs = parsePositiveInteger(process.env.ADAPTIVE_INTERACTION_TIMEOUT_MS, Math.min(timeoutMs, 15_000), 'ADAPTIVE_INTERACTION_TIMEOUT_MS');
const maxCandidates = parsePositiveInteger(process.env.ADAPTIVE_DISCOVERY_MAX_CANDIDATES, 40, 'ADAPTIVE_DISCOVERY_MAX_CANDIDATES');
const maxClicks = parsePositiveInteger(process.env.ADAPTIVE_DISCOVERY_MAX_CLICKS, 12, 'ADAPTIVE_DISCOVERY_MAX_CLICKS');
const probeMessage = process.env.ADAPTIVE_PROBE_MESSAGE ?? 'Hello';

const corpus = parseCorpus(JSON.parse(await readFile(corpusFile, 'utf8')) as unknown);
await mkdir(outputFile.split('/').slice(0, -1).join('/') || '.', { recursive: true });
await mkdir(evidenceDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results: TargetResult[] = [];

try {
  for (const target of corpus.targets) {
    const startedAt = Date.now();
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      const run = await new AdaptiveDiscoveryExperimentRunner(page, {
        maxCandidates,
        maxClicks,
        highConfidenceThreshold: 35,
      }).run();

      const discovery = run.selected ? 'CHAT_SURFACE_FOUND' : run.experiments.length > 0 ? 'CANDIDATE_FOUND' : 'NOT_FOUND';
      const interaction = run.selected
        ? await verifyAdaptiveInteraction(page, target.id, probeMessage, evidenceDirectory, verificationTimeoutMs)
        : undefined;

      results.push({
        targetId: target.id,
        targetUrl: target.url,
        discovery,
        clicksAttempted: run.clicksAttempted,
        durationMs: Date.now() - startedAt,
        ...(interaction ? { interaction } : {}),
      });
    } catch (error) {
      results.push({
        targetId: target.id,
        targetUrl: target.url,
        discovery: 'ERROR',
        clicksAttempted: 0,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const report: Report = {
  schemaVersion: 'adaptive-interaction-benchmark-0.1',
  generatedAt: new Date().toISOString(),
  corpusFile,
  probeMessage,
  targetCount: corpus.targets.length,
  selectedCount: results.filter((result) => result.discovery === 'CHAT_SURFACE_FOUND').length,
  verifiedCount: results.filter((result) => result.interaction?.execution.conversation === 'VERIFIED').length,
  results,
};

await writeFile(outputFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  outputFile,
  evidenceDirectory,
  targetCount: report.targetCount,
  selectedCount: report.selectedCount,
  verifiedCount: report.verifiedCount,
  screenshotCount: results.reduce((count, result) => count + (result.interaction?.screenshotPaths.length ?? 0), 0),
}, null, 2));

function parseCorpus(value: unknown): { targets: Target[] } {
  if (!isRecord(value) || !Array.isArray(value.targets) || value.targets.length === 0) {
    throw new Error('Discovery benchmark corpus requires a non-empty targets array');
  }
  const targets = value.targets.map((target, index) => {
    if (!isRecord(target) || typeof target.id !== 'string' || typeof target.name !== 'string' || typeof target.url !== 'string') {
      throw new Error(`Discovery benchmark target at index ${index} requires id, name and url strings`);
    }
    return {
      id: target.id,
      name: target.name,
      url: target.url,
      ...(typeof target.status === 'string' ? { status: target.status } : {}),
    };
  });
  return { targets };
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
