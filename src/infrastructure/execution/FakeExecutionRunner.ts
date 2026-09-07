import type { ExecutionRunner, ExecutionRunnerInput, ExecutionRunnerOptions, ExecutionRunnerResult } from '../../application/ports/ExecutionRunner.js';

export class FakeExecutionRunner implements ExecutionRunner {
  public calls: Array<{ input: ExecutionRunnerInput; options: ExecutionRunnerOptions }> = [];

  public constructor(
    private readonly result: ExecutionRunnerResult = { status: 'PASSED' },
    private readonly failure?: Error,
  ) {}

  public async execute(
    input: ExecutionRunnerInput,
    options: ExecutionRunnerOptions,
  ): Promise<ExecutionRunnerResult> {
    this.calls.push({ input, options });
    if (this.failure) throw this.failure;
    return this.result;
  }
}
