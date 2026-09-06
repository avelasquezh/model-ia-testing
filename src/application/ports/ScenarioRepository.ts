import type { Scenario } from '../../domain/scenario/Scenario.js';

export interface ScenarioRepository {
  save(scenario: Scenario): Promise<void>;
  findById(id: string): Promise<Scenario | null>;
  findAllByTargetId(targetId: string): Promise<readonly Scenario[]>;
}
