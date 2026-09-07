import { describe, expect, it } from 'vitest';
import { ExecuteScenario } from './ExecuteScenario.js';
import { SecureExecuteScenario } from './SecureExecuteScenario.js';
import { InMemoryExecutionSecurityPolicy } from '../../infrastructure/security/InMemoryExecutionSecurityPolicy.js';
import { InMemoryExecutionRepository } from '../../infrastructure/persistence/InMemoryExecutionRepository.js';
import { InMemoryScenarioRepository } from '../../infrastructure/persistence/InMemoryScenarioRepository.js';
import { InMemoryTargetRepository } from '../../infrastructure/persistence/InMemoryTargetRepository.js';
import { FakeExecutionRunner } from '../../infrastructure/execution/FakeExecutionRunner.js';
import { Scenario } from '../../domain/scenario/Scenario.js';
import { Target } from '../../domain/target/Target.js';
import type { TargetAvailabilityPort } from '../ports/TargetPorts.js';

describe('SecureExecuteScenario', () => {
  const scenario = new Scenario({
    id: 'scenario-1', targetId: 'target-1', name: 'Greeting', objective: 'Validate greeting',
    description: 'Controlled security execution', inputs: [{ value: 'Hola' }],
    expectedBehavior: 'Responds', finishConditions: [{ description: 'Completes' }], version: 1,
  });

  class FixedIds { generate(): string { return 'execution-1'; } }
  const available: TargetAvailabilityPort = { isAvailable: async () => true };

  it('allows execution for explicitly authorized targets', async () => {
    const scenarios = new InMemoryScenarioRepository();
    const targets = new InMemoryTargetRepository();
    const executions = new InMemoryExecutionRepository();
    await scenarios.save(scenario);
    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));

    const runner = new FakeExecutionRunner({ status: 'PASSED' });
    const execution = new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner, available);
    const secure = new SecureExecuteScenario(
      scenarios,
      execution,
      new InMemoryExecutionSecurityPolicy(['target-1']),
    );

    const result = await secure.execute({ scenarioId: 'scenario-1' });
    expect(result.props.status).toBe('PASSED');
  });

  it('blocks execution for targets outside the allowlist', async () => {
    const scenarios = new InMemoryScenarioRepository();
    const targets = new InMemoryTargetRepository();
    const executions = new InMemoryExecutionRepository();
    await scenarios.save(scenario);
    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));

    const runner = new FakeExecutionRunner({ status: 'PASSED' });
    const execution = new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner, available);
    const secure = new SecureExecuteScenario(
      scenarios,
      execution,
      new InMemoryExecutionSecurityPolicy(['different-target']),
    );

    await expect(secure.execute({ scenarioId: 'scenario-1' })).rejects.toThrow('Execution target is not authorized');
    expect(runner.calls).toHaveLength(0);
  });
});
