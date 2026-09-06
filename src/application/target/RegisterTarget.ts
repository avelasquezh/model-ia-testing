import { Target } from '../../domain/target/Target.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { TargetRepository } from '../ports/TargetRepository.js';

export type RegisterTargetInput = {
  readonly name: string;
  readonly url: string;
};

export class RegisterTarget {
  public constructor(
    private readonly repository: TargetRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: RegisterTargetInput): Promise<Target> {
    const target = new Target({
      id: this.ids.generate(),
      name: input.name,
      url: input.url,
      status: 'ACTIVE',
    });

    await this.repository.save(target);
    return target;
  }
}
