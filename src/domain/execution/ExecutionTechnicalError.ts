export type ExecutionTechnicalError = {
  readonly code: string;
  readonly message: string;
  readonly operation: 'OPEN' | 'SEND' | 'CLOSE';
  readonly turnIndex?: number;
  readonly occurredAt: Date;
};
