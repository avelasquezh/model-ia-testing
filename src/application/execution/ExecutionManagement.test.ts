import { describe, expect, it } from 'vitest';
import { ExecuteScenario } from './ExecuteScenario.js';
import { FakeExecutionRunner } from '../../infrastructure/execution/FakeExecutionRunner.js';
import { InMemoryExecutionRepository } from '../../infrastructure/persistence/InMemoryExecutionRepository.js';
import { InMemoryScenarioRepository } from '../../infrastructure/persistence/InMemoryScenarioRepository.js';
import { InMemoryTargetRepository } from '../../infrastructure/persistence/InMemoryTargetRepository.js';
import { Scenario } from '../../domain/scenario/Scenario.js';
import { Target } from '../../domain/target/Target.js';
import type { TargetAvailabilityPort } from '../ports/TargetPorts.js';

describe('ExecuteScenario', () => {
  const scenario = new Scenario({
    id: 'scenario-1', targetId: 'target-1', name: 'Greeting', objective: 'Validate greeting',
    description: 'Basic conversation', inputs: [{ value: 'Hola' }, { value: '¿Cómo estás?' }],
    expectedBehavior: 'Responds to greeting', finishConditions: [{ description: 'Assistant responds' }], version: 2,
  });

  class FixedIds {
    private current = 0;
    generate(): string {
      this.current += 1;
      return `id-${this.current}`;
    }
  }

  const available: TargetAvailabilityPort = {
    isAvailable: async () => true,
  };

  it('delegates execution to the runner and persists its terminal state and observations', async () => {
    const targets = new InMemoryTargetRepository();
    const scenarios = new InMemoryScenarioRepository();
    const executions = new InMemoryExecutionRepository();
    const firstStartedAt = new Date('2026-09-05T21:59:59.500Z');
    const firstObservedAt = new Date('2026-09-05T22:00:00.000Z');
    const secondStartedAt = new Date('2026-09-05T22:00:00.500Z');
    const secondObservedAt = new Date('2026-09-05T22:00:01.000Z');
    const observations = [
      {
        input: 'Hola',
        response: 'Hola, ¿en qué puedo ayudarte?',
        startedAt: firstStartedAt,
        observedAt: firstObservedAt,
        durationMs: 500,
      },
      {
        input: '¿Cómo estás?',
        response: 'Estoy bien.',
        startedAt: secondStartedAt,
        observedAt: secondObservedAt,
        durationMs: 500,
      },
    ];
    const runner = new FakeExecutionRunner({ status: 'PASSED', observations });
    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));
    await scenarios.save(scenario);

    const execution = await new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner, available).execute({
      scenarioId: 'scenario-1',
    });

    expect(execution.props.status).toBe('PASSED');
    expect(execution.props.finishedAt).toBeInstanceOf(Date);
    expect(execution.props.observations).toEqual(observations);
    expect(execution.props.errors).toEqual([]);
    expect(runner.calls).toHaveLength(1);
    expect(runner.calls[0]?.input.scenario.props.id).toBe('scenario-1');
    expect(runner.calls[0]?.input.target.props.url).toBe('https://example.com');
    expect(runner.calls[0]?.input.execution.props.status).toBe('RUNNING');
    expect(runner.calls[0]?.options.timeoutMs).toBe(60_000);
    expect(await executions.findById(execution.props.id)).toBe(execution);
  });

  it('persists technical errors returned by the runner', async () => {
    const targets = new InMemoryTargetRepository();
    const scenarios = new InMemoryScenarioRepository();
    const executions = new InMemoryExecutionRepository();
    const occurredAt = new Date('2026-09-05T22:00:02.000Z');
    const errors = [{
      code: 'Error',
      message: 'interaction failure',
      operation: 'SEND' as const,
      turnIndex: 1,
      occurredAt,
    }];
    const runner = new FakeExecutionRunner({ status: 'ERROR', errors });
    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));
    await scenarios.save(scenario);

    const execution = await new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner, available).execute({
      scenarioId: 'scenario-1',
    });

    expect(execution.props.status).toBe('ERROR');
    expect(execution.props.errors).toEqual(errors);
    expect(await executions.findById(execution.props.id)).toBe(execution);
  });

  it('finishes the execution as ERROR when the runner fails', async () => {
    const targets = new InMemoryTargetRepository();
    const scenarios = new InMemoryScenarioRepository();
    const executions = new InMemoryExecutionRepository();
    const runner = new FakeExecutionRunner();
    runner.execute = async () => { throw new Error('runner failure'); };
    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));
    await scenarios.save(scenario);

    const execution = await new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner, available).execute({
      scenarioId: 'scenario-1',
    });

    expect(execution.props.status).toBe('ERROR');
    expect(execution.props.finishedAt).toBeInstanceOf(Date);
    expect(await executions.findById(execution.props.id)).toBe(execution);
  });

  it('rejects execution when the target is inactive without invoking the runner', async () => {
    const targets = new InMemoryTargetRepository();
    const scenarios = new InMemoryScenarioRepository();
    const executions = new InMemoryExecutionRepository();
    const runner = new FakeExecutionRunner();
    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'INACTIVE' }));
    await scenarios.save(scenario);

    await expect(new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner, available).execute({
      scenarioId: 'scenario-1',
    })).rejects.toThrow('Target must be active to execute');
    expect(runner.calls).toHaveLength(0);
  });

  it('rejects execution when the active target is unavailable without creating an execution', async () => {
    const targets = new InMemoryTargetRepository();
    const scenarios = new InMemoryScenarioRepository();
    const executions = new InMemoryExecutionRepository();
    const runner = new FakeExecutionRunner();
    const unavailable: TargetAvailabilityPort = {
      isAvailable: async () => false,
    };
    await targets.save(new Target({ id: 'target-1', name: 'Demo', url: 'https://example.com', status: 'ACTIVE' }));
    await scenarios.save(scenario);

    await expect(new ExecuteScenario(scenarios, targets, executions, new FixedIds(), runner, unavailable).execute({
      scenarioId: 'scenario-1',
    })).rejects.toThrow('Target is not available');
    expect(runner.calls).toHaveLength(0);
    expect(await executions.findById('id-1')).toBeNull();
  });
});
