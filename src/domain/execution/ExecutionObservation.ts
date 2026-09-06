export type ExecutionObservation = {
  readonly input: string;
  readonly response: string;
  readonly startedAt: Date;
  readonly observedAt: Date;
  readonly durationMs: number;
  readonly screenshot?: Uint8Array;
};
