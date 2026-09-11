import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, type Browser } from '@playwright/test';
import { AdaptiveDiscoveryExperimentRunner, type AdaptiveDiscoveryRun } from '../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryExperimentRunner.js';
import { PlaywrightChatDiscovery } from '../src/infrastructure/execution/playwright/PlaywrightChatDiscovery.js';

type Target = { readonly id: string; readonly name: string; readonly url: string; readonly status?: string };
type Corpus = { readonly targets: readonly Target[] };
type StageName = 'DOM_INVENTORY' | 'SAFE_PROBE_1' | 'SAFE_EXPLORATION_3' | 'SAFE_EXPLORATION_12';
type StageResult = {
  readonly stage: StageName;
  readonly ok: boolean;
  readonly durationMs: number;
  readonly candidatesConsidered?: number;
  readonly clicksAttempted?: number;
  readonly experiments?: number;
  readonly chatSurfaceFound?: boolean;
  readonly debugEvents?: number;
  readonly error?: string;
};
type TargetResult = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly legacy: { readonly ok: boolean; readonly durationMs: number; readonly error?: string };
  readonly stages: readonly StageResult[];
};
type Report = {
  readonly schemaVersion: 'discovery-staged-evidence-0.1';
  readonly generatedAt: string;
  readonly experimentalBoundary: {
    readonly sendReceive: 'NOT_PERFORMED';
    readonly note: string;
  };
  readonly targets: readonly TargetResult[];
  readonly summary: {
    readonly targetCount: number;
    readonly legacyDiscovered: number;
    readonly stageChatSurfaceByStage: Record<StageName, number>;
    readonly stageClicksByStage: Record<StageName, number>;
  };
};

const corpusFile = process.env.DISCOVERY_BENCHMARK_CORPUS_FILE ?? 'examples/public-sut-discovery-corpus.json';
const outputFile = process.env.DISCOVERY_STAGED_OUTPUT_FILE ?? 'artifacts/browser-sut/discovery-staged-evidence.json';
const timeoutMs = Number.parseInt(process.env.DISCOVERY_BENCHMARK_TIMEOUT_MS ?? '30000', 10);
const settleMs = Number.parseInt(process.env.ADAPTIVE_DISCOVERY_SETTLE_MS ?? '350', 10);
const maxCandidates = Number.parseInt(process.env.ADAPTIVE_DISCOVERY_MAX_CANDIDATES ?? '40', 10);

const stages: readonly { name: StageName; maxClicks: number }[] = [
  { name: 'DOM_INVENTORY', maxClicks: 0 },
  { name: 'SAFE_PROBE_1', maxClicks: 1 },
  { name: 'SAFE_EXPLORATION_3', maxClicks: 3 },
  { name: 'SAFE_EXPLORATION_12', maxClicks: 12 },
];

async function main(): Promise<void> {
  const corpus = JSON.parse(await readFile(corpusFile, 'utf8')) as Corpus;
  const browser = await chromium.launch({ headless: true });
  try {
    const targets: TargetResult[] = [];
    for (const target of corpus.targets) {
      targets.push(await runTarget(browser, target));
    }

    const stageChatSurfaceByStage = Object.fromEntries(stages.map(({ name }) => [name, targets.filter((target) => target.stages.find((stage) => stage.stage === name)?.chatSurfaceFound).length])) as Record<StageName, number>;
    const stageClicksByStage = Object.fromEntries(stages.map(({ name }) => [name, targets.reduce((sum, target) => sum + (target.stages.find((stage) => stage.stage === name)?.clicksAttempted ?? 0), 0)])) as Record<StageName, number>;
    const report: Report = {
      schemaVersion: 'discovery-staged-evidence-0.1',
      generatedAt: new Date().toISOString(),
      experimentalBoundary: {
        sendReceive: 'NOT_PERFORMED',
        note: 'All staged executions stop at discovery evidence. No composer input, SEND action or RECEIVE verification is performed.',
      },
      targets,
      summary: {
        targetCount: targets.length,
        legacyDiscovered: targets.filter((target) => target.legacy.ok).length,
        stageChatSurfaceByStage,
        stageClicksByStage,
      },
    };
    await mkdir(outputFile.substring(0, outputFile.lastIndexOf('/')), { recursive: true });
    await writeFile(outputFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify(report.summary, null, 2));
  } finally {
    await browser.close();
  }
}

async function runTarget(browser: Browser, target: Target): Promise<TargetResult> {
  const legacyContext = await browser.newContext();
  const legacyPage = await legacyContext.newPage();
  const legacyStarted = Date.now();
  let legacy: TargetResult['legacy'];
  try {
    await legacyPage.goto(target.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await new PlaywrightChatDiscovery(legacyPage).discoverWithEvidence();
    legacy = { ok: true, durationMs: Date.now() - legacyStarted };
  } catch (error) {
    legacy = { ok: false, durationMs: Date.now() - legacyStarted, error: errorMessage(error) };
  } finally {
    await legacyContext.close();
  }

  const stageResults: StageResult[] = [];
  for (const stage of stages) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const started = Date.now();
    try {
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      const run: AdaptiveDiscoveryRun = await new AdaptiveDiscoveryExperimentRunner(page, {
        maxCandidates,
        maxClicks: stage.maxClicks,
        settleMs,
      }).run();
      stageResults.push({
        stage: stage.name,
        ok: true,
        durationMs: Date.now() - started,
        candidatesConsidered: run.candidatesConsidered,
        clicksAttempted: run.clicksAttempted,
        experiments: run.experiments.length,
        chatSurfaceFound: Boolean(run.selected),
        debugEvents: run.debug.length,
      });
    } catch (error) {
      stageResults.push({ stage: stage.name, ok: false, durationMs: Date.now() - started, error: errorMessage(error) });
    } finally {
      await context.close();
    }
  }

  return { id: target.id, name: target.name, url: target.url, legacy, stages: stageResults };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

await main();
