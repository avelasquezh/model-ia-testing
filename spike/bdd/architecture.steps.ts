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
