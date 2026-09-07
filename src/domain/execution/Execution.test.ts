import { describe, expect, it } from 'vitest';
import { Execution } from './Execution.js';

const pending = () => new Execution({
  id: 'execution-1', scenarioId: 'scenario-1', scenarioVersion: 1,
  targetId: 'target-1', targetUrl: 'https://example.com', status: 'PENDING',
});

describe('Execution', () => {
  it('transitions from pending to running and then to a terminal status', () => {
    const startedAt = new Date('2026-09-05T20:00:00Z');
    const finishedAt = new Date('2026-09-05T20:00:05Z');
    const running = pending().start(startedAt);
    const finished = running.finish('PASSED', finishedAt);

    expect(running.props.status).toBe('RUNNING');
    expect(running.props.startedAt).toBe(startedAt);
    expect(finished.props.status).toBe('PASSED');
    expect(finished.props.finishedAt).toBe(finishedAt);
  });

  it('prevents invalid lifecycle transitions', () => {
    expect(() => pending().finish('PASSED')).toThrow('Only running executions can finish');
    expect(() => pending().start().start()).toThrow('Only pending executions can start');
  });
});
