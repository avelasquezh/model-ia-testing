import { describe, expect, it } from 'vitest';
import { buildParallelBenchmarkReport, toComparisonRecords, type BenchmarkObservation } from './AdaptiveDiscoveryBenchmark.js';
import { summarizeDiscoveryComparison } from './DiscoveryComparison.js';

describe('adaptive discovery benchmark', () => {
  const observations: BenchmarkObservation[] = [
    { model: 'LEGACY', targetId: 'a', targetUrl: 'https://example.test/a', outcome: 'VERIFIED', attempts: 1, durationMs: 100 },
    { model: 'LEGACY', targetId: 'b', targetUrl: 'https://example.test/b', outcome: 'NOT_FOUND', attempts: 3, durationMs: 200, failureReason: 'NO_LAUNCHER' },
    { model: 'ADAPTIVE', targetId: 'a', targetUrl: 'https://example.test/a', outcome: 'VERIFIED', attempts: 2, durationMs: 150 },
    { model: 'ADAPTIVE', targetId: 'b', targetUrl: 'https://example.test/b', outcome: 'CHAT_SURFACE_FOUND', attempts: 1, durationMs: 90 },
  ];

  it('preserves one comparable record per model and target', () => {
    expect(toComparisonRecords(observations)).toEqual([
      { model: 'LEGACY', targetUrl: 'https://example.test/a', outcome: 'VERIFIED', attempts: 1, durationMs: 100 },
      { model: 'LEGACY', targetUrl: 'https://example.test/b', outcome: 'NOT_FOUND', attempts: 3, durationMs: 200 },
      { model: 'ADAPTIVE', targetUrl: 'https://example.test/a', outcome: 'VERIFIED', attempts: 2, durationMs: 150 },
      { model: 'ADAPTIVE', targetUrl: 'https://example.test/b', outcome: 'CHAT_SURFACE_FOUND', attempts: 1, durationMs: 90 },
    ]);
  });

  it('retains target identity and operational failure evidence in raw observations', () => {
    expect(observations[1].targetId).toBe('b');
    expect(observations[1].failureReason).toBe('NO_LAUNCHER');
  });

  it('calculates discovery and verification rates independently', () => {
    const summary = summarizeDiscoveryComparison(toComparisonRecords(observations));
    expect(summary.legacy.discoveryRate).toBe(0.5);
    expect(summary.legacy.verificationRate).toBe(0.5);
    expect(summary.adaptive.discoveryRate).toBe(1);
    expect(summary.adaptive.verificationRate).toBe(0.5);
  });

  it('builds a versioned report without changing the metric semantics', () => {
    const report = buildParallelBenchmarkReport(observations, summarizeDiscoveryComparison);
    expect(report.schemaVersion).toBe('adaptive-discovery-benchmark-0.1');
    expect(report.observations).toHaveLength(4);
    expect(report.comparison.adaptive.discoveryRate).toBe(1);
  });
});
