import { describe, expect, it } from 'vitest';
import { InMemoryExecutionSecurityPolicy } from './InMemoryExecutionSecurityPolicy.js';

describe('InMemoryExecutionSecurityPolicy', () => {
  it('authorizes only explicitly allowed targets', async () => {
    const policy = new InMemoryExecutionSecurityPolicy(['target-1']);

    await expect(policy.authorizeTarget('target-1')).resolves.toBe(true);
    await expect(policy.authorizeTarget('target-2')).resolves.toBe(false);
  });

  it('enforces a positive maximum execution timeout', () => {
    const policy = new InMemoryExecutionSecurityPolicy(['target-1'], 5_000);

    expect(() => policy.validateTimeout(5_000)).not.toThrow();
    expect(() => policy.validateTimeout(5_001)).toThrow('Execution timeout exceeds configured maximum');
    expect(() => policy.validateTimeout(0)).toThrow('Execution timeout must be a positive integer');
  });
});
