export type DiscoveryModel = 'LEGACY' | 'ADAPTIVE';

export type DiscoveryAttemptOutcome =
  | 'NOT_FOUND'
  | 'CANDIDATE_FOUND'
  | 'CHAT_SURFACE_FOUND'
  | 'VERIFIED';

export type DiscoveryComparisonRecord = {
  readonly model: DiscoveryModel;
  readonly targetUrl: string;
  readonly outcome: DiscoveryAttemptOutcome;
  readonly attempts: number;
  readonly durationMs?: number;
};

export type DiscoveryComparisonSummary = {
  readonly legacy: ModelMetrics;
  readonly adaptive: ModelMetrics;
};

type ModelMetrics = {
  readonly runs: number;
  readonly verified: number;
  readonly chatSurfaceFound: number;
  readonly candidateFound: number;
  readonly notFound: number;
  readonly verificationRate: number;
  readonly discoveryRate: number;
};

export function summarizeDiscoveryComparison(records: readonly DiscoveryComparisonRecord[]): DiscoveryComparisonSummary {
  return {
    legacy: summarizeModel(records.filter((record) => record.model === 'LEGACY')),
    adaptive: summarizeModel(records.filter((record) => record.model === 'ADAPTIVE')),
  };
}

function summarizeModel(records: readonly DiscoveryComparisonRecord[]): ModelMetrics {
  const runs = records.length;
  const verified = records.filter((record) => record.outcome === 'VERIFIED').length;
  const chatSurfaceFound = records.filter((record) => record.outcome === 'CHAT_SURFACE_FOUND' || record.outcome === 'VERIFIED').length;
  const candidateFound = records.filter((record) => record.outcome !== 'NOT_FOUND').length;

  return {
    runs,
    verified,
    chatSurfaceFound,
    candidateFound,
    notFound: runs - candidateFound,
    verificationRate: rate(verified, runs),
    discoveryRate: rate(chatSurfaceFound, runs),
  };
}

function rate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}
