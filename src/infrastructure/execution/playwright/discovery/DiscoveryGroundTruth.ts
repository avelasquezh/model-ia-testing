import type { BenchmarkModel, BenchmarkObservation } from './AdaptiveDiscoveryBenchmark.js';

export type FunctionalValidation = 'VERIFIED' | 'FAILED' | 'NOT_PERFORMED';

export type GroundTruthObservation = BenchmarkObservation & {
  readonly targetId: string;
  /** Whether the corpus target is known to contain a usable chat surface. */
  readonly expectedChat: boolean;
  /** Independent SEND -> RECEIVE result; never inferred from discovery score. */
  readonly functionalValidation: FunctionalValidation;
};

export type DiscoveryConfusionMatrix = {
  readonly truePositives: number;
  readonly falsePositives: number;
  readonly trueNegatives: number;
  readonly falseNegatives: number;
};

export type DiscoveryGroundTruthMetrics = DiscoveryConfusionMatrix & {
  readonly model: BenchmarkModel;
  readonly evaluatedRuns: number;
  readonly unevaluatedRuns: number;
  readonly precision: number;
  readonly recall: number;
  readonly falsePositiveRate: number;
};

function rate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function isSelected(observation: GroundTruthObservation): boolean {
  return observation.outcome !== 'NOT_FOUND';
}

export function calculateGroundTruthMetrics(
  model: BenchmarkModel,
  observations: readonly GroundTruthObservation[],
): DiscoveryGroundTruthMetrics {
  const evaluated = observations.filter((observation) => observation.functionalValidation !== 'NOT_PERFORMED');
  const unevaluatedRuns = observations.length - evaluated.length;

  const truePositives = evaluated.filter(
    (observation) => observation.expectedChat && isSelected(observation) && observation.functionalValidation === 'VERIFIED',
  ).length;
  const falsePositives = evaluated.filter(
    (observation) => !observation.expectedChat && isSelected(observation),
  ).length + evaluated.filter(
    (observation) => observation.expectedChat && isSelected(observation) && observation.functionalValidation === 'FAILED',
  ).length;
  const trueNegatives = evaluated.filter(
    (observation) => !observation.expectedChat && !isSelected(observation),
  ).length;
  const falseNegatives = evaluated.filter(
    (observation) => observation.expectedChat && !isSelected(observation),
  ).length;

  return {
    model,
    evaluatedRuns: evaluated.length,
    unevaluatedRuns,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    precision: rate(truePositives, truePositives + falsePositives),
    recall: rate(truePositives, truePositives + falseNegatives),
    falsePositiveRate: rate(falsePositives, falsePositives + trueNegatives),
  };
}
