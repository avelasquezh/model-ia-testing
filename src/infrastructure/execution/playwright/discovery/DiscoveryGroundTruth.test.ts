import { describe, expect, it } from 'vitest';
import { calculateGroundTruthMetrics, type GroundTruthObservation } from './DiscoveryGroundTruth.js';

const observation = (
  overrides: Partial<GroundTruthObservation>,
): GroundTruthObservation => ({
  targetId: 'target',
  model: 'ADAPTIVE',
  targetUrl: 'https://example.test',
  outcome: 'NOT_FOUND',
  attempts: 0,
  durationMs: 10,
  expectedChat: true,
  functionalValidation: 'NOT_PERFORMED',
  ...overrides,
});

describe('calculateGroundTruthMetrics', () => {
  it('separates evaluated runs from runs without functional ground truth', () => {
    const result = calculateGroundTruthMetrics('ADAPTIVE', [
      observation({ outcome: 'CHAT_SURFACE_FOUND', functionalValidation: 'VERIFIED' }),
      observation({ outcome: 'NOT_FOUND', functionalValidation: 'NOT_PERFORMED' }),
    ]);

    expect(result.evaluatedRuns).toBe(1);
    expect(result.unevaluatedRuns).toBe(1);
    expect(result.truePositives).toBe(1);
    expect(result.precision).toBe(1);
    expect(result.recall).toBe(1);
  });

  it('counts a selected but functionally invalid chat on a positive target as a false positive', () => {
    const result = calculateGroundTruthMetrics('ADAPTIVE', [
      observation({ outcome: 'CHAT_SURFACE_FOUND', functionalValidation: 'FAILED' }),
    ]);

    expect(result.truePositives).toBe(0);
    expect(result.falsePositives).toBe(1);
    expect(result.falseNegatives).toBe(0);
    expect(result.precision).toBe(0);
  });

  it('counts a missed known chat as a false negative', () => {
    const result = calculateGroundTruthMetrics('LEGACY', [
      observation({ model: 'LEGACY', outcome: 'NOT_FOUND', functionalValidation: 'VERIFIED' }),
    ]);

    expect(result.falseNegatives).toBe(1);
    expect(result.recall).toBe(0);
  });

  it('counts selected non-chat targets as false positives and missed non-chat targets as true negatives', () => {
    const result = calculateGroundTruthMetrics('ADAPTIVE', [
      observation({ expectedChat: false, outcome: 'CHAT_SURFACE_FOUND', functionalValidation: 'FAILED' }),
      observation({ expectedChat: false, outcome: 'NOT_FOUND', functionalValidation: 'FAILED' }),
    ]);

    expect(result.falsePositives).toBe(1);
    expect(result.trueNegatives).toBe(1);
    expect(result.falsePositiveRate).toBe(0.5);
  });
});
