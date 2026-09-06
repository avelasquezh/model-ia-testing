import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { Scenario } from '../domain/Scenario.js';
import { ExecuteScenario } from '../application/ExecuteScenario.js';
import type { BrowserPort } from '../application/ports/BrowserPort.js';
import type { Evidence, EvidencePort } from '../application/ports/EvidencePort.js';

class ControlledBrowser implements BrowserPort {
  public async open(_targetUrl: string): Promise<void> {}
  public async sendMessage(message: string): Promise<string> { return `response:${message}`; }
  public async close(): Promise<void> {}
}

class ControlledEvidence implements EvidencePort {
  public readonly items: Evidence[] = [];
  public async capture(item: Evidence): Promise<void> { this.items.push(item); }
}

let scenario: Scenario;
let runId: string;
let evidence: ControlledEvidence;

Given('a valid scenario with one conversational step', () => {
  scenario = new Scenario('BDD-001', [{ message: 'hello', expectedResponse: 'response' }]);
});

When('the scenario is executed with controlled adapters', async () => {
  evidence = new ControlledEvidence();
  runId = await new ExecuteScenario(new ControlledBrowser(), evidence).execute(scenario, 'https://example.invalid');
});

Then('a run identifier is returned', () => {
  expect(runId).toMatch(/[0-9a-f-]{36}/);
});

Then('evidence is correlated with that run', () => {
  expect(evidence.items).toHaveLength(1);
  expect(evidence.items[0]?.runId).toBe(runId);
});
