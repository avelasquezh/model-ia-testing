import type { Scenario } from '../../domain/scenario/Scenario.js';
import type { ScenarioRepository } from '../../application/ports/ScenarioRepository.js';

export class InMemoryScenarioRepository implements ScenarioRepository {
  private readonly scenarios = new Map<string, Scenario>();

  public async save(scenario: Scenario): Promise<void> {
    this.scenarios.set(scenario.props.id, scenario);
  }

  public async findById(id: string): Promise<Scenario | null> {
    return this.scenarios.get(id) ?? null;
  }

  public async findAllByTargetId(targetId: string): Promise<readonly Scenario[]> {
    return [...this.scenarios.values()].filter((scenario) => scenario.props.targetId === targetId);
  }
}
