import { describe, expect, it } from 'vitest';
import { ObservableTiming } from './ObservableTiming.js';

describe('ObservableTiming', () => {
  const date = (seconds: number) => new Date(`2026-09-06T10:00:${seconds.toString().padStart(2, '0')}.000Z`);

  it('measures time to first response from input send', () => {
    const result = ObservableTiming.measure({
      interactionStartedAt: date(0),
      inputSentAt: date(1),
      firstResponseAt: date(4),
    });

    expect(result.props.timeToFirstResponseMs).toBe(3000);
  });

  it('measures completed response and total interaction independently', () => {
    const result = ObservableTiming.measure({
      interactionStartedAt: date(0),
      inputSentAt: date(1),
      firstResponseAt: date(3),
      responseCompletedAt: date(5),
      interactionFinishedAt: date(6),
    });

    expect(result.props.timeToFirstResponseMs).toBe(2000);
    expect(result.props.timeToCompleteResponseMs).toBe(4000);
    expect(result.props.interactionDurationMs).toBe(6000);
  });

  it('allows measurements when later observable events are unavailable', () => {
    const result = ObservableTiming.measure({
      interactionStartedAt: date(0),
      inputSentAt: date(1),
    });

    expect(result.props.timeToFirstResponseMs).toBeUndefined();
    expect(result.props.timeToCompleteResponseMs).toBeUndefined();
    expect(result.props.interactionDurationMs).toBeUndefined();
  });

  it('rejects non-chronological timestamps', () => {
    expect(() => ObservableTiming.measure({
      interactionStartedAt: date(0),
      inputSentAt: date(4),
      firstResponseAt: date(3),
    })).toThrow('Observable timing timestamps must be chronological');
  });

  it('rejects invalid timestamps', () => {
    expect(() => ObservableTiming.measure({
      interactionStartedAt: new Date('invalid'),
      inputSentAt: date(1),
    })).toThrow('Observable timing timestamps must be valid dates');
  });
});
