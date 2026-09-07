import type { Execution } from '../../domain/execution/Execution.js';
import type { SuiteRepository } from '../ports/SuiteRepository.js';
import type { ExecuteScenario, ExecuteScenarioInput } from '../execution/ExecuteScenario.js';

export type ExecuteSuiteInput = {
  readonly suiteId: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
};

export class ExecuteSuite {
  public constructor(
    private readonly suites: SuiteRepository,
    private readonly executeScenario: ExecuteScenario,
  ) {}

  public async execute(input: ExecuteSuiteInput): Promise<readonly Execution[]> {
    const suite = await this.suites.findById(input.suiteId);
    if (!suite) throw new Error('Suite not found');

    const executions: Execution[] = [];

    for (const scenarioId of suite.props.scenarioIds) {
      const scenarioInput: ExecuteScenarioInput = {
        scenarioId,
        ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
        ...(input.signal !== undefined ? { signal: input.signal } : {}),
      };

      executions.push(await this.executeScenario.execute(scenarioInput));

      if (input.signal?.aborted) break;
    }

    return executions;
  }
}
