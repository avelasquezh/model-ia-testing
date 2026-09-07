import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { Scenario } from '../../src/domain/scenario/Scenario.js';
import { Target } from '../../src/domain/target/Target.js';
import { ExecuteScenario } from '../../src/application/execution/ExecuteScenario.js';
import { EvaluationVersionContext } from '../../src/domain/versioning/EvaluationVersionContext.js';
import type { TargetAvailabilityPort } from '../../src/application/ports/TargetPorts.js';
import { InMemoryScenarioRepository } from '../../src/infrastructure/persistence/InMemoryScenarioRepository.js';
import { InMemoryTargetRepository } from '../../src/infrastructure/persistence/InMemoryTargetRepository.js';
import { InMemoryExecutionRepository } from '../../src/infrastructure/persistence/InMemoryExecutionRepository.js';
import { FakeExecutionRunner } from '../../src/infrastructure/execution/FakeExecutionRunner.js';

const scenarios = new InMemoryScenarioRepository();
const targets = new InMemoryTargetRepository();
const executions = new InMemoryExecutionRepository();
const versionContext = new EvaluationVersionContext({
  productVersion: '0.1.0',
  evaluationMethodVersion: 'f2-method-0.1',
  criterionCatalogVersion: 'f2-criteria-0.1',
  decisionRulesVersion: 'f2-rules-0.1',
  ...(process.env.GITHUB_SHA ? { commitSha: process.env.GITHUB_SHA } : {}),
});

class FixedIds {
  private current = 0;

  public generate(): string {
    this.current += 1;
    return `bdd-execution-${this.current}`;
  }
}

let executionId: string;
let scenarioVersion: number;
let executionStatus: string;

Given('an active target and a versioned conversational scenario', async () => {
  await targets.save(new Target({
    id: 'bdd-target',
    name: 'BDD target',
    url: 'https://example.invalid',
    status: 'ACTIVE',
  }));

  const scenario = new Scenario({
    id: 'bdd-scenario',
    targetId: 'bdd-target',
    name: 'Greeting conversation',
    objective: 'Verify conversational execution',
    description: 'Acceptance-level multi-turn scenario',
    inputs: [{ value: 'hello' }, { value: 'continue' }],
    expectedBehavior: 'The runner completes the conversation successfully',
    finishConditions: [{ description: 'Execution reaches a terminal status' }],
    version: 2,
  });

  await scenarios.save(scenario);
  scenarioVersion = scenario.props.version;
});

When('the scenario is executed with a controlled runner', async () => {
  const available: TargetAvailabilityPort = { isAvailable: async () => true };
  const runner = new FakeExecutionRunner({ status: 'PASSED' });

  const execution = await new ExecuteScenario(
    scenarios,
    targets,
    executions,
    new FixedIds(),
    runner,
    available,
    versionContext,
  ).execute({ scenarioId: 'bdd-scenario' });

  executionId = execution.props.id;
  executionStatus = execution.props.status;
});

Then('the execution finishes with the runner outcome', () => {
  expect(executionStatus).toBe('PASSED');
});

Then('the execution preserves the scenario version', async () => {
  const execution = await executions.findById(executionId);
  expect(execution?.props.scenarioVersion).toBe(scenarioVersion);
});

Then('the execution identifier is available for traceability', () => {
  expect(executionId).toBe('bdd-execution-1');
});
