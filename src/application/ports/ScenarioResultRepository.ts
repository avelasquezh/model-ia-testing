import type { ScenarioResult } from '../../domain/result/ScenarioResult.js';

export interface ScenarioResultRepository {
  save(result: ScenarioResult): Promise<void>;
  findByExecutionId(executionId: string): Promise<ScenarioResult | undefined>;
}
