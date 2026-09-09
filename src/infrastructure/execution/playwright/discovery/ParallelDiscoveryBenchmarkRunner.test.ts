import { describe, expect, it } from 'vitest';
import { classifyAdaptiveDiscoveryOutcome } from './ParallelDiscoveryBenchmarkRunner.js';

describe('classifyAdaptiveDiscoveryOutcome', () => {
  it('requires a selected behavioral result for a chat surface', () => {
    expect(classifyAdaptiveDiscoveryOutcome({ selected: undefined, experiments: [] })).toBe('NOT_FOUND');
    expect(classifyAdaptiveDiscoveryOutcome({ selected: undefined, experiments: [{} as never] })).toBe('CANDIDATE_FOUND');
    expect(classifyAdaptiveDiscoveryOutcome({ selected: {} as never, experiments: [{} as never] })).toBe('CHAT_SURFACE_FOUND');
  });
});
