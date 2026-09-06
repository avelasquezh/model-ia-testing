import { describe, expect, it } from 'vitest';
import { Scenario } from '../domain/Scenario.js';
import { ExecuteScenario } from './ExecuteScenario.js';
import type { BrowserPort } from './ports/BrowserPort.js';
import type { Evidence, EvidencePort } from './ports/EvidencePort.js';

class FakeBrowser implements BrowserPort {
  public readonly messages: string[] = [];
  public async open(_targetUrl: string): Promise<void> {}
  public async sendMessage(message: string): Promise<string> {
    this.messages.push(message);
    return `response:${message}`;
  }
  public async close(): Promise<void> {}
}

class InMemoryEvidence implements EvidencePort {
  public readonly items: Evidence[] = [];
  public async capture(evidence: Evidence): Promise<void> {
    this.items.push(evidence);
  }
}

describe('ExecuteScenario', () => {
  it('executes without a real browser and preserves evidence correlation', async () => {
    const browser = new FakeBrowser();
    const evidence = new InMemoryEvidence();
    const useCase = new ExecuteScenario(browser, evidence);
    const scenario = new Scenario('SPIKE-EXEC-001', [
      { message: 'hola', expectedResponse: 'respuesta' },
      { message: 'adios', expectedResponse: 'despedida' },
    ]);

    const runId = await useCase.execute(scenario, 'https://example.invalid');

    expect(runId).toMatch(/[0-9a-f-]{36}/);
    expect(browser.messages).toEqual(['hola', 'adios']);
    expect(evidence.items).toHaveLength(2);
    expect(evidence.items.every((item) => item.runId === runId)).toBe(true);
  });
});
