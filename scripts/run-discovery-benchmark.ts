import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { buildParallelBenchmarkReport } from '../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryBenchmark.js';
import { summarizeDiscoveryComparison } from '../src/infrastructure/execution/playwright/discovery/DiscoveryComparison.js';
import { ParallelDiscoveryBenchmarkRunner, type DiscoveryBenchmarkTarget } from '../src/infrastructure/execution/playwright/discovery/ParallelDiscoveryBenchmarkRunner.js';

const corpusFile = process.env.DISCOVERY_BENCHMARK_CORPUS_FILE ?? 'examples/public-sut-discovery-corpus.json';
const outputFile = process.env.DISCOVERY_BENCHMARK_OUTPUT_FILE ?? 'artifacts/browser-sut/adaptive-discovery-benchmark.json';
const navigationTimeoutMs = parsePositiveInteger(process.env.DISCOVERY_BENCHMARK_TIMEOUT_MS, 30_000, 'DISCOVERY_BENCHMARK_TIMEOUT_MS');
const adaptiveMaxCandidates = parsePositiveInteger(process.env.ADAPTIVE_DISCOVERY_MAX_CANDIDATES, 40, 'ADAPTIVE_DISCOVERY_MAX_CANDIDATES');
const adaptiveMaxClicks = parsePositiveInteger(process.env.ADAPTIVE_DISCOVERY_MAX_CLICKS, 12, 'ADAPTIVE_DISCOVERY_MAX_CLICKS');
const adaptiveThreshold = parseInteger(process.env.ADAPTIVE_DISCOVERY_THRESHOLD, 35, 'ADAPTIVE_DISCOVERY_THRESHOLD');

const corpus = parseCorpus(JSON.parse(await readFile(corpusFile, 'utf8')) as unknown);
const browser = await chromium.launch({ headless: true });

try {
  const runner = new ParallelDiscoveryBenchmarkRunner(browser, {
    navigationTimeoutMs,
    adaptive: {
      maxCandidates: adaptiveMaxCandidates,
      maxClicks: adaptiveMaxClicks,
      highConfidenceThreshold: adaptiveThreshold,
    },
  });
  const result = await runner.run(corpus.targets);
  const report = buildParallelBenchmarkReport(result.observations, summarizeDiscoveryComparison);

  await mkdir(outputFile.split('/').slice(0, -1).join('/') || '.', { recursive: true });
  await writeFile(outputFile, JSON.stringify({
    ...report,
    corpusFile,
    targetCount: corpus.targets.length,
    errors: result.errors,
    experimentalBoundary: {
      verification: 'NOT_PERFORMED',
      note: 'CHAT_SURFACE_FOUND is a discovery outcome only. SEND -> RECEIVE verification is intentionally not inferred from DOM evidence.',
    },
  }, null, 2));

  console.log(JSON.stringify({
    outputFile,
    targetCount: corpus.targets.length,
    observationCount: result.observations.length,
    errors: result.errors.length,
    comparison: report.comparison,
  }, null, 2));
} finally {
  await browser.close();
}

function parseCorpus(value: unknown): { targets: DiscoveryBenchmarkTarget[] } {
  if (!isRecord(value) || !Array.isArray(value.targets) || value.targets.length === 0) {
    throw new Error('Discovery benchmark corpus requires a non-empty targets array');
  }

  const targets = value.targets.map((target, index) => {
    if (!isRecord(target) || typeof target.id !== 'string' || typeof target.name !== 'string' || typeof target.url !== 'string') {
      throw new Error(`Discovery benchmark target at index ${index} requires id, name and url strings`);
    }
    if (!/^https?:\/\//i.test(target.url)) {
      throw new Error(`Discovery benchmark target ${target.id} must use http or https`);
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
  const parsed = parseInteger(value, fallback, name);
  if (parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function parseInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`${name} must be an integer`);
  return parsed;
}
