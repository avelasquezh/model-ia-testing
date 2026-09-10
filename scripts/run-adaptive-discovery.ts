import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { AdaptiveDiscoveryExperimentRunner } from '../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryExperimentRunner.js';

const targetUrl = process.env.ADAPTIVE_DISCOVERY_URL;
const outputFile = process.env.ADAPTIVE_DISCOVERY_OUTPUT_FILE ?? 'artifacts/browser-sut/adaptive-discovery.json';
const maxCandidates = parsePositiveInteger(process.env.ADAPTIVE_DISCOVERY_MAX_CANDIDATES, 40);
const maxClicks = parsePositiveInteger(process.env.ADAPTIVE_DISCOVERY_MAX_CLICKS, 12);
const threshold = parseInteger(process.env.ADAPTIVE_DISCOVERY_THRESHOLD, 35);

if (!targetUrl) throw new Error('ADAPTIVE_DISCOVERY_URL is required');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const runner = new AdaptiveDiscoveryExperimentRunner(page, {
    maxCandidates,
    maxClicks,
    highConfidenceThreshold: threshold,
  });
  const result = await runner.run();
  const report = {
    schemaVersion: 'adaptive-discovery-0.1',
    targetUrl,
    options: { maxCandidates, maxClicks, threshold },
    generatedAt: new Date().toISOString(),
    ...result,
  };
  await mkdir(outputFile.substring(0, outputFile.lastIndexOf('/')) || '.', { recursive: true });
  await writeFile(outputFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ targetUrl, outputFile, candidatesConsidered: result.candidatesConsidered, clicksAttempted: result.clicksAttempted, experiments: result.experiments.length, selected: result.selected?.classification ?? null }, null, 2));
} finally {
  await browser.close();
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Expected positive integer, received: ${value}`);
  return parsed;
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`Expected integer, received: ${value}`);
  return parsed;
}
