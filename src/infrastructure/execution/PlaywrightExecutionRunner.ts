import type {
  ExecutionRunner,
  ExecutionRunnerInput,
  ExecutionRunnerOptions,
  ExecutionRunnerResult,
} from '../../application/ports/ExecutionRunner.js';
import type { ConversationPort } from '../../application/ports/ConversationPort.js';

export class PlaywrightExecutionRunner implements ExecutionRunner {
  public constructor(private readonly conversation: ConversationPort) {}

  public async execute(
    input: ExecutionRunnerInput,
    options: ExecutionRunnerOptions,
  ): Promise<ExecutionRunnerResult> {
    const session = await this.conversation.open(
      input.target.props.url,
      options.timeoutMs,
    );

    try {
      if (options.signal?.aborted) return { status: 'CANCELLED' };

      for (const conversationInput of input.scenario.props.inputs) {
        if (options.signal?.aborted) return { status: 'CANCELLED' };

        await this.withCancellation(
          session.send(conversationInput, options.timeoutMs),
          options.signal,
        );
      }

      return { status: 'INCONCLUSIVE' };
    } finally {
      await session.close();
    }
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
}
