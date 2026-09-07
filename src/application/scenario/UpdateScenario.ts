import type { Scenario, ConversationInput, FinishCondition } from '../../domain/scenario/Scenario.js';
import type { ScenarioRepository } from '../ports/ScenarioRepository.js';

export type UpdateScenarioInput = {
  readonly scenarioId: string;
  readonly name: string;
  readonly objective: string;
  readonly description: string;
  readonly inputs: readonly ConversationInput[];
  readonly expectedBehavior: string;
  readonly finishConditions: readonly FinishCondition[];
};

export class UpdateScenario {
  public constructor(private readonly repository: ScenarioRepository) {}

  public async execute(input: UpdateScenarioInput): Promise<Scenario> {
    const current = await this.repository.findById(input.scenarioId);
    if (!current) throw new Error('Scenario not found');

    const next = current.nextVersion({
      targetId: current.props.targetId,
      name: input.name,
      objective: input.objective,
      description: input.description,
      inputs: input.inputs,
      expectedBehavior: input.expectedBehavior,
      finishConditions: input.finishConditions,
    });

    await this.repository.save(next);
    return next;
  }
}
