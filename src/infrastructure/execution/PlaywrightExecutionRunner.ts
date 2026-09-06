import type {
  ExecutionRunner,
  ExecutionRunnerInput,
  ExecutionRunnerOptions,
  ExecutionRunnerResult,
} from '../../application/ports/ExecutionRunner.js';
import type { ConversationPort } from '../../application/ports/ConversationPort.js';
import type { ExecutionObservation } from '../../domain/execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../../domain/execution/ExecutionTechnicalError.js';

export class PlaywrightExecutionRunner implements ExecutionRunner {
  public constructor(private readonly conversation: ConversationPort) {}

  public async execute(
    input: ExecutionRunnerInput,
    options: ExecutionRunnerOptions,
  ): Promise<ExecutionRunnerResult> {
    let session;
    try {
      session = await this.conversation.open(input.target.props.url, options.timeoutMs);
    } catch (error) {
      return {
        status: 'ERROR',
        errors: [this.toTechnicalError(error, 'OPEN')],
      };
    }

    const observations: ExecutionObservation[] = [];
    const errors: ExecutionTechnicalError[] = [];

    try {
      for (let index = 0; index < input.scenario.props.inputs.length; index += 1) {
        if (options.signal?.aborted) {
          return { status: 'CANCELLED', observations, errors };
        }

        const conversationInput = input.scenario.props.inputs[index];
        const startedAt = new Date();

        try {
          const response = await this.withCancellation(
            session.send(conversationInput, options.timeoutMs),
            options.signal,
          );
          const durationMs = response.observedAt.getTime() - startedAt.getTime();

          observations.push({
            input: conversationInput.value,
            response: response.value,
            startedAt,
            observedAt: response.observedAt,
            durationMs,
            ...(response.screenshot !== undefined ? { screenshot: response.screenshot } : {}),
          });
        } catch (error) {
          if (this.isAbortError(error)) {
            return { status: 'CANCELLED', observations, errors };
          }
          errors.push(this.toTechnicalError(error, 'SEND', index));
          break;
        }
      }
    } finally {
      try {
        await session.close();
      } catch (error) {
        errors.push(this.toTechnicalError(error, 'CLOSE'));
      }
    }

    if (errors.length > 0) {
      return { status: 'ERROR', observations, errors };
    }

    return { status: 'INCONCLUSIVE', observations };
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

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }
}
