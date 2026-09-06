import type { Execution } from '../../domain/execution/Execution.js';
import type { ExecutionSecurityPort } from '../ports/ExecutionSecurityPort.js';
import type { ExecuteScenario, ExecuteScenarioInput } from './ExecuteScenario.js';

export class SecureExecuteScenario {
  public constructor(
    private readonly execution: ExecuteScenario,
    private readonly security: ExecutionSecurityPort,
  ) {}

  public async execute(input: ExecuteScenarioInput): Promise<Execution> {
    const timeoutMs = input.timeoutMs ?? 60_000;
    this.security.validateTimeout(timeoutMs);

    const authorized = await this.security.authorizeTarget(input.scenarioId);
    if (!authorized) throw new Error('Execution target is not authorized');

    return this.execution.execute(input);
  }
}
