import type { IdGenerator } from '../ports/TargetPorts.js';
import type { ScenarioRepository } from '../ports/ScenarioRepository.js';
import { Scenario, type ConversationInput, type FinishCondition } from '../../domain/scenario/Scenario.js';

export type CreateScenarioInput = {
  readonly targetId: string;
  readonly name: string;
  readonly objective: string;
  readonly description: string;
  readonly inputs: readonly ConversationInput[];
  readonly expectedBehavior: string;
  readonly finishConditions: readonly FinishCondition[];
};

export class CreateScenario {
  public constructor(
    private readonly repository: ScenarioRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: CreateScenarioInput): Promise<Scenario> {
    const scenario = new Scenario({
      id: this.ids.generate(),
      targetId: input.targetId,
      name: input.name,
      objective: input.objective,
      description: input.description,
      inputs: input.inputs,
      expectedBehavior: input.expectedBehavior,
      finishConditions: input.finishConditions,
      version: 1,
    });

    await this.repository.save(scenario);
    return scenario;
  }
}
