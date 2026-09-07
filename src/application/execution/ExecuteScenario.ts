import { Execution } from '../../domain/execution/Execution.js';
import type { IdGenerator, TargetAvailabilityPort } from '../ports/TargetPorts.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { ExecutionRunner, ExecutionRunnerOptions } from '../ports/ExecutionRunner.js';
import type { ScenarioRepository } from '../ports/ScenarioRepository.js';
import type { TargetRepository } from '../ports/TargetRepository.js';

const DEFAULT_TIMEOUT_MS = 60_000;

export type ExecuteScenarioInput = {
  readonly scenarioId: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
};

export class ExecuteScenario {
  public constructor(
    private readonly scenarios: ScenarioRepository,
    private readonly targets: TargetRepository,
    private readonly executions: ExecutionRepository,
    private readonly ids: IdGenerator,
    private readonly runner: ExecutionRunner,
    private readonly availability: TargetAvailabilityPort,
  ) {}

  public async execute(input: ExecuteScenarioInput): Promise<Execution> {
    const scenario = await this.scenarios.findById(input.scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const target = await this.targets.findById(scenario.props.targetId);
    if (!target) throw new Error('Target not found');
    if (target.props.status !== 'ACTIVE') throw new Error('Target must be active to execute');

    const available = await this.availability.isAvailable(target.props.url);
    if (!available) throw new Error('Target is not available');

    const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error('Execution timeout must be a positive integer');
    }

    const running = new Execution({
      id: this.ids.generate(),
      scenarioId: scenario.props.id,
      scenarioVersion: scenario.props.version,
      targetId: target.props.id,
      targetUrl: target.props.url,
      targetConfiguration: {
        id: target.props.id,
        name: target.props.name,
        url: target.props.url,
        status: 'ACTIVE',
      },
      status: 'PENDING',
    }).start();

    await this.executions.save(running);

    let finalExecution: Execution;
    try {
      const runnerOptions: ExecutionRunnerOptions = input.signal
        ? { timeoutMs, signal: input.signal }
        : { timeoutMs };
      const result = await this.runner.execute(
        { execution: running, scenario, target },
        runnerOptions,
      );
      finalExecution = running.finish(
        result.status,
        new Date(),
        result.observations,
        result.errors,
      );
    } catch {
      finalExecution = running.finish('ERROR');
    }

    await this.executions.save(finalExecution);
    return finalExecution;
  }
}
