import type { Execution } from '../../domain/execution/Execution.js';
import type { ScenarioRepository } from '../ports/ScenarioRepository.js';
import type { ExecutionSecurityPort } from '../ports/ExecutionSecurityPort.js';
import type { ExecuteScenario, ExecuteScenarioInput } from './ExecuteScenario.js';

export class SecureExecuteScenario {
  public constructor(
    private readonly scenarios: ScenarioRepository,
    private readonly execution: ExecuteScenario,
    private readonly security: ExecutionSecurityPort,
  ) {}

  public async execute(input: ExecuteScenarioInput): Promise<Execution> {
    const scenario = await this.scenarios.findById(input.scenarioId);
    if (!scenario) throw new Error('Scenario not found');

    const timeoutMs = input.timeoutMs ?? 60_000;
    this.security.validateTimeout(timeoutMs);

    const authorized = await this.security.authorizeTarget(scenario.props.targetId);
    if (!authorized) throw new Error('Execution target is not authorized');

    return this.execution.execute(input);
  }
}
