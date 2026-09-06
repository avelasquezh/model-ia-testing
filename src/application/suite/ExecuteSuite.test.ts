import { describe, expect, it } from 'vitest';
import { ExecuteScenario } from '../execution/ExecuteScenario.js';
import { ExecuteSuite } from './ExecuteSuite.js';
import { Scenario } from '../../domain/scenario/Scenario.js';
import { Suite } from '../../domain/suite/Suite.js';
import { Target } from '../../domain/target/Target.js';
import { InMemoryExecutionRepository } from '../../infrastructure/persistence/InMemoryExecutionRepository.js';
import { InMemoryScenarioRepository } from '../../infrastructure/persistence/InMemoryScenarioRepository.js';
import { InMemorySuiteRepository } from '../../infrastructure/persistence/InMemorySuiteRepository.js';
import { InMemoryTargetRepository } from '../../infrastructure/persistence/InMemoryTargetRepository.js';
import { FakeExecutionRunner } from '../../infrastructure/execution/FakeExecutionRunner.js';

class FixedIds {
  private current = 0;

  generate(): string {
    this.current += 1;
    return `execution-${this.current}`;
  }
}

const makeScenario = (id: string): Scenario => new Scenario({
  id,
  targetId: 'target-001',
  name: `Scenario ${id}`,
  objective: 'Validate conversational behavior',
  description: 'Scenario used by suite execution tests',
  inputs: [{ value: 'Hola' }],
  expectedBehavior: 'Responds to the greeting',
  finishConditions: [{ description: 'A response is received' }],
  version: 1,
});

describe('ExecuteSuite', () => {
  it('executes suite scenarios sequentially and returns their executions', async () => {
    const suites = new InMemorySuiteRepository();
    const scenarios = new InMemoryScenarioRepository();
    const targets = new InMemoryTargetRepository();
    const executions = new InMemoryExecutionRepository();
    const runner = new FakeExecutionRunner({ status: 'INCONCLUSIVE', observations: [] });
    const executeScenario = new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner);
    const executeSuite = new ExecuteSuite(suites, executeScenario);

    await targets.save(new Target({ id: 'target-001', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));
    await scenarios.save(makeScenario('scenario-001'));
    await scenarios.save(makeScenario('scenario-002'));
    await suites.save(new Suite({
      id: 'suite-001',
      name: 'Regression',
      scenarioIds: ['scenario-001', 'scenario-002'],
    }));

    const result = await executeSuite.execute({ suiteId: 'suite-001', timeoutMs: 5_000 });

    expect(result).toHaveLength(2);
    expect(result.map((execution) => execution.props.scenarioId)).toEqual([
      'scenario-001',
      'scenario-002',
    ]);
    expect(runner.calls).toHaveLength(2);
    expect(runner.calls[0]?.input.scenario.props.id).toBe('scenario-001');
    expect(runner.calls[1]?.input.scenario.props.id).toBe('scenario-002');
    expect(runner.calls[0]?.options.timeoutMs).toBe(5_000);
    expect(runner.calls[1]?.options.timeoutMs).toBe(5_000);
  });

  it('rejects execution when the suite does not exist', async () => {
    const suites = new InMemorySuiteRepository();
    const scenarios = new InMemoryScenarioRepository();
    const targets = new InMemoryTargetRepository();
    const executions = new InMemoryExecutionRepository();
    const runner = new FakeExecutionRunner();
    const executeScenario = new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner);
    const executeSuite = new ExecuteSuite(suites, executeScenario);

    await expect(executeSuite.execute({ suiteId: 'missing' })).rejects.toThrow('Suite not found');
    expect(runner.calls).toHaveLength(0);
  });

  it('stops starting new scenarios after cancellation', async () => {
    const suites = new InMemorySuiteRepository();
    const scenarios = new InMemoryScenarioRepository();
    const targets = new InMemoryTargetRepository();
    const executions = new InMemoryExecutionRepository();
    const runner = new FakeExecutionRunner({ status: 'CANCELLED', observations: [] });
    const executeScenario = new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner);
    const executeSuite = new ExecuteSuite(suites, executeScenario);
    const controller = new AbortController();

    await targets.save(new Target({ id: 'target-001', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));
    await scenarios.save(makeScenario('scenario-001'));
    await scenarios.save(makeScenario('scenario-002'));
    await suites.save(new Suite({
      id: 'suite-001',
      name: 'Regression',
      scenarioIds: ['scenario-001', 'scenario-002'],
    }));

    controller.abort();
    const result = await executeSuite.execute({ suiteId: 'suite-001', signal: controller.signal });

    expect(result).toHaveLength(1);
    expect(result[0]?.props.status).toBe('CANCELLED');
    expect(runner.calls).toHaveLength(1);
  });
});
