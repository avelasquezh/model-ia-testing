import type {
  ExecutionEvidencePublisher,
  ExecutionEvidenceEvent,
} from '../../application/ports/ExecutionEvidencePublisher.js';
import type {
  ExecutionRunner,
  ExecutionRunnerInput,
  ExecutionRunnerOptions,
  ExecutionRunnerResult,
} from '../../application/ports/ExecutionRunner.js';
import type { ConversationPort } from '../../application/ports/ConversationPort.js';
import type { ExecutionObservation } from '../../domain/execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../../domain/execution/ExecutionTechnicalError.js';

const NOOP_EVIDENCE_PUBLISHER: ExecutionEvidencePublisher = {
  publish: async () => undefined,
};

export class PlaywrightExecutionRunner implements ExecutionRunner {
  public constructor(
    private readonly conversation: ConversationPort,
    private readonly evidencePublisher: ExecutionEvidencePublisher = NOOP_EVIDENCE_PUBLISHER,
  ) {}

  public async execute(
    input: ExecutionRunnerInput,
    options: ExecutionRunnerOptions,
  ): Promise<ExecutionRunnerResult> {
    const deadline = Date.now() + options.timeoutMs;
    let session;

    try {
      const remainingTimeoutMs = this.remainingTimeout(deadline);
      if (remainingTimeoutMs <= 0) {
        const error = this.toTimeoutError('OPEN');
        await this.publishError(input.execution.props.id, error);
        return { status: 'ERROR', errors: [error] };
      }
      session = await this.conversation.open(input.target.props.url, remainingTimeoutMs);
    } catch (error) {
      const technicalError = this.toTechnicalError(error, 'OPEN');
      await this.publishError(input.execution.props.id, technicalError);
      return { status: 'ERROR', errors: [technicalError] };
    }

    const observations: ExecutionObservation[] = [];
    const errors: ExecutionTechnicalError[] = [];

    try {
      for (const [index, conversationInput] of input.scenario.props.inputs.entries()) {
        if (options.signal?.aborted) {
          return { status: 'CANCELLED', observations, errors };
        }

        const remainingTimeoutMs = this.remainingTimeout(deadline);
        if (remainingTimeoutMs <= 0) {
          const error = this.toTimeoutError('SEND', index);
          errors.push(error);
          await this.publishError(input.execution.props.id, error);
          return { status: 'ERROR', observations, errors };
        }

        const startedAt = new Date();

        try {
          const response = await this.withCancellation(
            session.send(conversationInput, remainingTimeoutMs),
            options.signal,
          );
          const durationMs = response.observedAt.getTime() - startedAt.getTime();

          const observation: ExecutionObservation = {
            input: conversationInput.value,
            response: response.value,
            startedAt,
            observedAt: response.observedAt,
            durationMs,
            ...(response.screenshot !== undefined ? { screenshot: response.screenshot } : {}),
          };

          observations.push(observation);
          await this.publishObservation(input.execution.props.id, index, observation);
        } catch (error) {
          if (this.isAbortError(error)) {
            return { status: 'CANCELLED', observations, errors };
          }
          const technicalError = this.toTechnicalError(error, 'SEND', index);
          errors.push(technicalError);
          await this.publishError(input.execution.props.id, technicalError);
          break;
        }
      }
    } finally {
      try {
        await session.close();
      } catch (error) {
        const technicalError = this.toTechnicalError(error, 'CLOSE');
        errors.push(technicalError);
        await this.publishError(input.execution.props.id, technicalError);
      }
    }

    if (errors.length > 0) {
      return { status: 'ERROR', observations, errors };
    }

    return { status: 'INCONCLUSIVE', observations };
  }

  private async publishObservation(
    executionId: string,
    turnIndex: number,
    observation: ExecutionObservation,
  ): Promise<void> {
    const event: ExecutionEvidenceEvent = {
      type: 'OBSERVATION',
      executionId,
      turnIndex,
      observation,
    };
    await this.evidencePublisher.publish(event);
  }

  private async publishError(executionId: string, error: ExecutionTechnicalError): Promise<void> {
    const event: ExecutionEvidenceEvent = {
      type: 'ERROR',
      executionId,
      error,
    };
    await this.evidencePublisher.publish(event);
  }

  private remainingTimeout(deadline: number): number {
    return Math.max(0, deadline - Date.now());
  }

  private async withCancellation<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return operation;
    if (signal.aborted) throw new DOMException('Execution cancelled', 'AbortError');

    return new Promise<T>((resolve, reject) => {
      const onAbort = () => reject(new DOMException('Execution cancelled', 'AbortError'));
      signal.addEventListener('abort', onAbort, { once: true });

      operation.then(
        (value) => {
          signal.removeEventListener('abort', onAbort);
          resolve(value);
        },
        (error) => {
          signal.removeEventListener('abort', onAbort);
          reject(error);
        },
      );
    });
  }

  private toTechnicalError(
    error: unknown,
    operation: ExecutionTechnicalError['operation'],
    turnIndex?: number,
  ): ExecutionTechnicalError {
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof Error && error.name ? error.name : 'UNKNOWN_ERROR';

    return {
      code,
      message,
      operation,
      ...(turnIndex !== undefined ? { turnIndex } : {}),
      occurredAt: new Date(),
    };
  }

  private toTimeoutError(
    operation: ExecutionTechnicalError['operation'],
    turnIndex?: number,
  ): ExecutionTechnicalError {
    return {
      code: 'TIMEOUT',
      message: 'Execution timeout exceeded',
      operation,
      ...(turnIndex !== undefined ? { turnIndex } : {}),
      occurredAt: new Date(),
    };
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }
}
