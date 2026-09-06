import { Suite } from '../../domain/suite/Suite.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { SuiteRepository } from '../ports/SuiteRepository.js';

export type CreateSuiteInput = {
  readonly name: string;
  readonly scenarioIds: readonly string[];
};

export class CreateSuite {
  public constructor(
    private readonly repository: SuiteRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  public async execute(input: CreateSuiteInput): Promise<Suite> {
    const suite = new Suite({
      id: this.idGenerator.generate(),
      name: input.name,
      scenarioIds: input.scenarioIds,
    });

    await this.repository.save(suite);
    return suite;
  }
}
