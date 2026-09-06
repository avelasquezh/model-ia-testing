import { describe, expect, it, vi } from 'vitest';
import { StructuredLogger } from './StructuredLogger.js';

describe('SPIKE-012 observability', () => {
  it('emits structured logs with a correlation identifier', () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    new StructuredLogger().info('scenario completed', { runId: 'run-001', scenarioId: 'scenario-001' });
    expect(write).toHaveBeenCalledWith(expect.stringContaining('"runId":"run-001"'));
    write.mockRestore();
  });
});
