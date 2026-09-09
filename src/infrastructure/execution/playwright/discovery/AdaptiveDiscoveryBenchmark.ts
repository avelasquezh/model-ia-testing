import type { AdaptiveDiscoveryRun } from './AdaptiveDiscoveryExperimentRunner.js';
import type { PublicSutFailureReason } from '../PublicSutFailureClassification.js';
import type { DiscoveryAttemptOutcome, DiscoveryComparisonRecord, DiscoveryComparisonSummary } from './DiscoveryComparison.js';

export type BenchmarkModel = 'LEGACY' | 'ADAPTIVE';

export type BenchmarkObservation = {
  readonly model: BenchmarkModel;
  readonly targetId: string;
  readonly targetUrl: string;
  readonly outcome: DiscoveryAttemptOutcome;
  readonly attempts: number;
  readonly durationMs: number;
  /** Operational failure classification; discovery success has no failure reason. */
  readonly failureReason?: PublicSutFailureReason;
  readonly adaptive?: AdaptiveDiscoveryRun;
};

export type ParallelBenchmarkReport = {
  readonly schemaVersion: 'adaptive-discovery-benchmark-0.1';
  readonly generatedAt: string;
  readonly observations: readonly BenchmarkObservation[];
  readonly comparison: DiscoveryComparisonSummary;
};

export function toComparisonRecords(observations: readonly BenchmarkObservation[]): DiscoveryComparisonRecord[] {
  return observations.map(({ model, targetUrl, outcome, attempts, durationMs }) => ({
    model,
    targetUrl,
    outcome,
    attempts,
    durationMs,
  }));
}

export function buildParallelBenchmarkReport(
  observations: readonly BenchmarkObservation[],
  summarize: (records: readonly DiscoveryComparisonRecord[]) => DiscoveryComparisonSummary,
): ParallelBenchmarkReport {
  const records = toComparisonRecords(observations);
  return {
    schemaVersion: 'adaptive-discovery-benchmark-0.1',
    generatedAt: new Date().toISOString(),
    observations,
    comparison: summarize(records),
  };
}
