import { describe, expect, it } from 'vitest';
import { loadConfig } from './Config.js';

describe('SPIKE-011 configuration', () => {
  it('loads valid configuration', () => {
    expect(loadConfig({ NODE_ENV: 'test', TARGET_TIMEOUT_MS: '5000' })).toEqual({
      environment: 'test',
      targetTimeoutMs: 5000,
    });
  });

  it('fails explicitly for invalid configuration', () => {
    expect(() => loadConfig({ NODE_ENV: 'test', TARGET_TIMEOUT_MS: '0' })).toThrow();
  });
});
