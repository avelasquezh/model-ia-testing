import { describe, expect, it } from 'vitest';
import { ExecuteScenario } from './ExecuteScenario.js';
import { InMemoryExecutionRepository } from '../../infrastructure/persistence/InMemoryExecutionRepository.js';
import { InMemoryScenarioRepository } from '../../infrastructure/persistence/InMemoryScenarioRepository.js';
import { InMemoryTargetRepository } from '../../infrastructure/persistence/InMemoryTargetRepository.js';
import { Scenario } from '../../domain/scenario/Scenario.js';
import { Target } from '../../domain/target/Target.js';

class FixedIds {
  private current = 0;
  generate(): string {
    this.current += 1;
    return `id-${this.current}`;
  }
}

describe('ExecuteScenario', () => {
  it('creates a running execution using the configured scenario version and target URL', async () => {
    const targets = new InMemoryTargetRepository();
    const scenarios = new InMemoryScenarioRepository();
    const executions = new InMemoryExecutionRepository();

    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));
    await scenarios.save(new Scenario({
      id: 'scenario-1', targetId: 'target-1', name: 'Greeting', objective: 'Validate greeting',
      description: 'Basic conversation', inputs: [{ value: 'Hola' }], expectedBehavior: 'Responds to greeting',
      finishConditions: [{ description: 'Assistant responds' }], version: 2,
    }));

    const execution = await new ExecuteScenario(scenarios, targets, executions, new FixedIds()).execute({ scenarioId: 'scenario-1' });

    expect(execution.props.status).toBe('RUNNING');
    expect(execution.props.scenarioVersion).toBe(2);
    expect(execution.props.targetUrl).toBe('https://example.com');
    expect(await executions.findById(execution.props.id)).toBe(execution);
  });

  it('rejects execution when the target is inactive', async () => {
    const targets = new InMemoryTargetRepository();
    const scenarios = new InMemoryScenarioRepository();
    const executions = new InMemoryExecutionRepository();

    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'INACTIVE' }));
    await scenarios.save(new Scenario({
      id: 'scenario-1', targetId: 'target-1', name: 'Greeting', objective: 'Validate greeting',
      description: 'Basic conversation', inputs: [{ value: 'Hola' }], expectedBehavior: 'Responds to greeting',
      finishConditions: [{ description: 'Assistant responds' }], version: 1,
    }));

    await expect(new ExecuteScenario(scenarios, targets, executions, new FixedIds()).execute({ scenarioId: 'scenario-1' }))
      .rejects.toThrow('Target must be active to execute');
  });
});
