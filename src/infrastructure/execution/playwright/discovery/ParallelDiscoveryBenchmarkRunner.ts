import type { Browser, Page } from '@playwright/test';
import { PlaywrightChatDiscovery } from '../PlaywrightChatDiscovery.js';
import { AdaptiveDiscoveryExperimentRunner, type AdaptiveDiscoveryRun, type AdaptiveDiscoveryRunnerOptions } from './AdaptiveDiscoveryExperimentRunner.js';
import type { BenchmarkModel, BenchmarkObservation } from './AdaptiveDiscoveryBenchmark.js';
import type { DiscoveryAttemptOutcome } from './DiscoveryComparison.js';

export type DiscoveryBenchmarkTarget = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly status?: string;
};

export type DiscoveryBenchmarkRunnerOptions = {
  readonly navigationTimeoutMs?: number;
  readonly adaptive?: AdaptiveDiscoveryRunnerOptions;
};

export type DiscoveryBenchmarkRunResult = {
  readonly observations: readonly BenchmarkObservation[];
  readonly errors: readonly {
    readonly model: BenchmarkModel;
    readonly targetId: string;
    readonly message: string;
  }[];
};

export function classifyAdaptiveDiscoveryOutcome(run: Pick<AdaptiveDiscoveryRun, 'selected' | 'experiments'>): DiscoveryAttemptOutcome {
  if (run.selected) return 'CHAT_SURFACE_FOUND';
  if (run.experiments.length > 0) return 'CANDIDATE_FOUND';
  return 'NOT_FOUND';
}

export class ParallelDiscoveryBenchmarkRunner {
  public constructor(
    private readonly browser: Browser,
    private readonly options: DiscoveryBenchmarkRunnerOptions = {},
  ) {}

  public async run(targets: readonly DiscoveryBenchmarkTarget[]): Promise<DiscoveryBenchmarkRunResult> {
    const observations: BenchmarkObservation[] = [];
    const errors: DiscoveryBenchmarkRunResult['errors'] = [];

    for (const target of targets) {
      for (const model of ['LEGACY', 'ADAPTIVE'] as const) {
        const startedAt = Date.now();
        let page: Page | undefined;
        try {
          const context = await this.browser.newContext();
          page = await context.newPage();
          await page.goto(target.url, {
            waitUntil: 'domcontentloaded',
            timeout: this.options.navigationTimeoutMs ?? 30_000,
          });

          const observation = model === 'LEGACY'
            ? await this.runLegacy(page, target.url, startedAt)
            : await this.runAdaptive(page, target.url, startedAt);
          observations.push(observation);
          await context.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push({ model, targetId: target.id, message });
          observations.push({
            model,
            targetUrl: target.url,
            outcome: 'NOT_FOUND',
            attempts: 0,
            durationMs: Date.now() - startedAt,
          });
          if (page) await page.context().close().catch(() => undefined);
        }
      }
    }

    return { observations, errors };
  }

  private async runLegacy(
    page: Page,
    targetUrl: string,
    startedAt: number,
  ): Promise<BenchmarkObservation> {
    try {
      const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();
      return {
        model: 'LEGACY',
        targetUrl,
        outcome: 'CHAT_SURFACE_FOUND',
        attempts: result.report.candidates.length,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      const report = error instanceof Error && 'report' in error
        ? (error as Error & { report?: { candidates?: readonly unknown[]; selected?: Record<string, unknown> } }).report
        : undefined;
      const hasCandidate = Boolean(report?.selected && Object.keys(report.selected).length > 0);
      return {
        model: 'LEGACY',
        targetUrl,
        outcome: hasCandidate ? 'CANDIDATE_FOUND' : 'NOT_FOUND',
        attempts: report?.candidates?.length ?? 0,
        durationMs: Date.now() - startedAt,
      };
    }
  }

  private async runAdaptive(
    page: Page,
    targetUrl: string,
    startedAt: number,
  ): Promise<BenchmarkObservation> {
    const run: AdaptiveDiscoveryRun = await new AdaptiveDiscoveryExperimentRunner(page, this.options.adaptive).run();
    return {
      model: 'ADAPTIVE',
      targetUrl,
      outcome: classifyAdaptiveDiscoveryOutcome(run),
      attempts: run.clicksAttempted,
      durationMs: Date.now() - startedAt,
      adaptive: run,
    };
  }
}
