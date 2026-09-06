export type ObservableTimingInput = {
  readonly interactionStartedAt: Date;
  readonly inputSentAt: Date;
  readonly firstResponseAt?: Date;
  readonly responseCompletedAt?: Date;
  readonly interactionFinishedAt?: Date;
};

export type ObservableTimingProps = {
  readonly timeToFirstResponseMs?: number;
  readonly timeToCompleteResponseMs?: number;
  readonly interactionDurationMs?: number;
};

export class ObservableTiming {
  public constructor(public readonly props: ObservableTimingProps) {}

  public static measure(input: ObservableTimingInput): ObservableTiming {
    const { interactionStartedAt, inputSentAt, firstResponseAt, responseCompletedAt, interactionFinishedAt } = input;
    const timestamps = [interactionStartedAt, inputSentAt, firstResponseAt, responseCompletedAt, interactionFinishedAt].filter(
      (value): value is Date => value !== undefined,
    );

    for (const timestamp of timestamps) {
      if (Number.isNaN(timestamp.getTime())) {
        throw new Error('Observable timing timestamps must be valid dates');
      }
    }

    for (let index = 1; index < timestamps.length; index += 1) {
      if (timestamps[index].getTime() < timestamps[index - 1].getTime()) {
        throw new Error('Observable timing timestamps must be chronological');
      }
    }

    const inputSent = inputSentAt.getTime();
    const firstResponse = firstResponseAt?.getTime();
    const completed = responseCompletedAt?.getTime();
    const finished = interactionFinishedAt?.getTime();

    return new ObservableTiming({
      timeToFirstResponseMs: firstResponse === undefined ? undefined : firstResponse - inputSent,
      timeToCompleteResponseMs: completed === undefined ? undefined : completed - inputSent,
      interactionDurationMs: finished === undefined ? undefined : finished - interactionStartedAt.getTime(),
    });
  }
}
