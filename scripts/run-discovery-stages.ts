import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, type Browser } from '@playwright/test';
import { AdaptiveDiscoveryExperimentRunner, type AdaptiveDiscoveryRun } from '../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryExperimentRunner.js';
import { ChatDiscoveryError, PlaywrightChatDiscovery } from '../src/infrastructure/execution/playwright/PlaywrightChatDiscovery.js';
import type { ChatDiscoveryReport } from '../src/infrastructure/execution/playwright/ChatDiscoveryReport.js';

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
type LegacyResult = {
  readonly executionOk: boolean;
  readonly candidateFound: boolean;
  readonly chatSurfaceFound: boolean;
  readonly launcherFound: boolean;
  readonly composerFound: boolean;
  readonly sendButtonFound: boolean;
  readonly responseFound: boolean;
  readonly status: ChatDiscoveryReport['status'];
  readonly durationMs: number;
  readonly error?: string;
};
type TargetResult = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly legacy: LegacyResult;
  readonly stages: readonly StageResult[];
};
type Report = {
  readonly schemaVersion: 'discovery-staged-evidence-0.2';
  readonly generatedAt: string;
  readonly experimentalBoundary: {
    readonly sendReceive: 'NOT_PERFORMED';
    readonly note: string;
  };
  readonly targets: readonly TargetResult[];
  readonly summary: {
    readonly targetCount: number;
    readonly legacyExecutionOk: number;
    readonly legacyCandidateFound: number;
    readonly legacyChatSurfaceFound: number;
    readonly legacyComposerFound: number;
    readonly legacySendButtonFound: number;
    readonly legacyResponseFound: number;
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
    for (const target of corpus.targets) targets.push(await runTarget(browser, target));

    const stageChatSurfaceByStage = Object.fromEntries(
      stages.map(({ name }) => [name, targets.filter((target) => target.stages.find((stage) => stage.stage === name)?.chatSurfaceFound).length]),
    ) as Record<StageName, number>;
    const stageClicksByStage = Object.fromEntries(
      stages.map(({ name }) => [name, targets.reduce((sum, target) => sum + (target.stages.find((stage) => stage.stage === name)?.clicksAttempted ?? 0), 0)]),
    ) as Record<StageName, number>;

    const report: Report = {
      schemaVersion: 'discovery-staged-evidence-0.2',
      generatedAt: new Date().toISOString(),
      experimentalBoundary: {
        sendReceive: 'NOT_PERFORMED',
        note: 'All staged executions stop at discovery evidence. No composer input, SEND action or RECEIVE verification is performed.',
      },
      targets,
      summary: {
        targetCount: targets.length,
        legacyExecutionOk: targets.filter((target) => target.legacy.executionOk).length,
        legacyCandidateFound: targets.filter((target) => target.legacy.candidateFound).length,
        legacyChatSurfaceFound: targets.filter((target) => target.legacy.chatSurfaceFound).length,
        legacyComposerFound: targets.filter((target) => target.legacy.composerFound).length,
        legacySendButtonFound: targets.filter((target) => target.legacy.sendButtonFound).length,
        legacyResponseFound: targets.filter((target) => target.legacy.responseFound).length,
        stageChatSurfaceByStage,
        stageClicksByStage,
      },
    };
    const outputDirectory = outputFile.includes('/') ? outputFile.slice(0, outputFile.lastIndexOf('/')) : '.';
    await mkdir(outputDirectory, { recursive: true });
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
  let legacy: LegacyResult;
  try {
    const discovery = await new PlaywrightChatDiscovery(legacyPage).discoverWithEvidence();
    const report = discovery.report;
    legacy = {
      executionOk: true,
      candidateFound: report.candidates.length > 0,
      chatSurfaceFound: report.status === 'DISCOVERED',
      launcherFound: Boolean(report.selected.launcher),
      composerFound: Boolean(report.selected.composer),
      sendButtonFound: Boolean(report.selected.sendButton),
      responseFound: Boolean(report.selected.response),
      status: report.status,
      durationMs: Date.now() - legacyStarted,
    };
  } catch (error) {
    const report = error instanceof ChatDiscoveryError ? error.report : undefined;
    legacy = {
      executionOk: false,
      candidateFound: Boolean(report?.candidates.length),
      chatSurfaceFound: report?.status === 'DISCOVERED',
      launcherFound: Boolean(report?.selected.launcher),
      composerFound: Boolean(report?.selected.composer),
      sendButtonFound: Boolean(report?.selected.sendButton),
      responseFound: Boolean(report?.selected.response),
      status: report?.status ?? 'FAILED',
      durationMs: Date.now() - legacyStarted,
      error: errorMessage(error),
    };
  } finally {
    await legacyPage.goto('about:blank').catch(() => undefined);
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
