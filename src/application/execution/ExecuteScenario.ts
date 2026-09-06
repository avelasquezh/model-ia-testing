import { Execution } from '../../domain/execution/Execution.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { ScenarioRepository } from '../ports/ScenarioRepository.js';
import type { TargetRepository } from '../ports/TargetRepository.js';

export type ExecuteScenarioInput = {
  readonly scenarioId: string;
};

export class ExecuteScenario {
  public constructor(
    private readonly scenarios: ScenarioRepository,
    private readonly targets: TargetRepository,
    private readonly executions: ExecutionRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: ExecuteScenarioInput): Promise<Execution> {
    const scenario = await this.scenarios.findById(input.scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const target = await this.targets.findById(scenario.props.targetId);
    if (!target) throw new Error('Target not found');
    if (target.props.status !== 'ACTIVE') throw new Error('Target must be active to execute');

    const execution = new Execution({
      id: this.ids.generate(),
      scenarioId: scenario.props.id,
      scenarioVersion: scenario.props.version,
      targetId: target.props.id,
      targetUrl: target.props.url,
      status: 'PENDING',
    }).start();

    await this.executions.save(execution);
    return execution;
  }
}
