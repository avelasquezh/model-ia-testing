import type { AdaptiveDiscoveryRun } from './AdaptiveDiscoveryExperimentRunner.js';
import type { AdaptiveInteractionVerification } from './AdaptiveInteractionVerification.js';
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
  readonly failureReason?: PublicSutFailureReason;
  readonly adaptive?: AdaptiveDiscoveryRun;
  readonly interaction?: AdaptiveInteractionVerification;
};
export type PairedBenchmarkOutcome = {
  readonly targetId: string;
  readonly targetUrl: string;
  readonly legacy?: BenchmarkObservation;
  readonly adaptive?: BenchmarkObservation;
  readonly winner: 'LEGACY' | 'ADAPTIVE' | 'TIE' | 'INCOMPLETE';
};
export type ParallelBenchmarkReport = {
  readonly schemaVersion: 'adaptive-discovery-benchmark-0.1';
  readonly generatedAt: string;
  readonly observations: readonly BenchmarkObservation[];
  readonly comparison: DiscoveryComparisonSummary;
  readonly paired: readonly PairedBenchmarkOutcome[];
};

export function toComparisonRecords(observations: readonly BenchmarkObservation[]): DiscoveryComparisonRecord[] {
  return observations.map(({ model, targetUrl, outcome, attempts, durationMs }) => ({ model, targetUrl, outcome, attempts, durationMs }));
}

export function pairBenchmarkObservations(observations: readonly BenchmarkObservation[]): PairedBenchmarkOutcome[] {
  const byTarget = new Map<string, { legacy?: BenchmarkObservation; adaptive?: BenchmarkObservation }>();
  for (const observation of observations) {
    const current = byTarget.get(observation.targetId) ?? {};
    byTarget.set(observation.targetId, observation.model === 'LEGACY' ? { ...current, legacy: observation } : { ...current, adaptive: observation });
  }
  return [...byTarget.entries()].map(([targetId, pair]) => ({
    targetId,
    targetUrl: pair.legacy?.targetUrl ?? pair.adaptive?.targetUrl ?? '',
    ...(pair.legacy ? { legacy: pair.legacy } : {}),
    ...(pair.adaptive ? { adaptive: pair.adaptive } : {}),
    winner: compareOutcome(pair.legacy?.outcome, pair.adaptive?.outcome),
  }));
}

export function buildParallelBenchmarkReport(
  observations: readonly BenchmarkObservation[], summarize: (records: readonly DiscoveryComparisonRecord[]) => DiscoveryComparisonSummary,
): ParallelBenchmarkReport {
  const records = toComparisonRecords(observations);
  return { schemaVersion: 'adaptive-discovery-benchmark-0.1', generatedAt: new Date().toISOString(), observations, comparison: summarize(records), paired: pairBenchmarkObservations(observations) };
}

function compareOutcome(legacy: DiscoveryAttemptOutcome | undefined, adaptive: DiscoveryAttemptOutcome | undefined): PairedBenchmarkOutcome['winner'] {
  if (!legacy || !adaptive) return 'INCOMPLETE';
  const rank: Record<DiscoveryAttemptOutcome, number> = { NOT_FOUND: 0, CANDIDATE_FOUND: 1, CHAT_SURFACE_FOUND: 2, VERIFIED: 3 };
  if (rank[legacy] === rank[adaptive]) return 'TIE';
  return rank[adaptive] > rank[legacy] ? 'ADAPTIVE' : 'LEGACY';
}
