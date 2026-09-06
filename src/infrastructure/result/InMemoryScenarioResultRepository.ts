import type { ScenarioResultRepository } from '../../application/ports/ScenarioResultRepository.js';
import type { ScenarioResult } from '../../domain/result/ScenarioResult.js';

export class InMemoryScenarioResultRepository implements ScenarioResultRepository {
  private readonly results = new Map<string, ScenarioResult>();

  public async save(result: ScenarioResult): Promise<void> {
    this.results.set(result.props.id, result);
  }

  public async findByExecutionId(executionId: string): Promise<ScenarioResult | undefined> {
    for (const result of this.results.values()) {
      if (result.props.executionId === executionId) return result;
    }
    return undefined;
  }
}
