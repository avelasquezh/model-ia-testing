import { Scenario } from '../domain/Scenario.js';
import type { BrowserPort } from './ports/BrowserPort.js';
import type { EvidencePort } from './ports/EvidencePort.js';

export class ExecuteScenario {
  public constructor(
    private readonly browser: BrowserPort,
    private readonly evidence: EvidencePort,
  ) {}

  public async execute(scenario: Scenario, targetUrl: string): Promise<string> {
    const runId = crypto.randomUUID();
    await this.browser.open(targetUrl);

    try {
      for (const step of scenario.steps) {
        const response = await this.browser.sendMessage(step.message);
        await this.evidence.capture({
          runId,
          type: 'TRANSCRIPT',
          content: JSON.stringify({ message: step.message, response }),
        });
      }
      return runId;
    } finally {
      await this.browser.close();
    }
  }
}
