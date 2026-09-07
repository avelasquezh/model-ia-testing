import type { Target } from '../../domain/target/Target.js';
import type { TargetRepository } from '../../application/ports/TargetRepository.js';

export class InMemoryTargetRepository implements TargetRepository {
  private readonly targets = new Map<string, Target>();

  public async save(target: Target): Promise<void> {
    this.targets.set(target.props.id, target);
  }

  public async findById(id: string): Promise<Target | null> {
    return this.targets.get(id) ?? null;
  }

  public async findAll(): Promise<readonly Target[]> {
    return [...this.targets.values()];
  }
}
