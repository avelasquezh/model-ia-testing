import type { ExecutionRunner, ExecutionRunnerInput, ExecutionRunnerOptions, ExecutionRunnerResult } from '../../application/ports/ExecutionRunner.js';
import type { BrowserAutomationPort } from '../../application/ports/BrowserAutomationPort.js';

export class PlaywrightExecutionRunner implements ExecutionRunner {
  public constructor(private readonly browser: BrowserAutomationPort) {}

  public async execute(
    input: ExecutionRunnerInput,
    options: ExecutionRunnerOptions,
  ): Promise<ExecutionRunnerResult> {
    const session = await this.browser.open();

    try {
      if (options.signal?.aborted) return { status: 'CANCELLED' };

      await this.withCancellation(
        session.navigate(input.target.props.url, options.timeoutMs),
        options.signal,
      );

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
