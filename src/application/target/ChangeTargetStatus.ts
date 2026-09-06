import type { Target } from '../../domain/target/Target.js';
import type { TargetRepository } from '../ports/TargetRepository.js';

export class ChangeTargetStatus {
  public constructor(private readonly repository: TargetRepository) {}

  public async activate(id: string): Promise<Target> {
    return this.change(id, (target) => target.activate());
  }

  public async deactivate(id: string): Promise<Target> {
    return this.change(id, (target) => target.deactivate());
  }

  private async change(id: string, transition: (target: Target) => Target): Promise<Target> {
    const target = await this.repository.findById(id);
    if (!target) throw new Error(`Target not found: ${id}`);

    const updated = transition(target);
    await this.repository.save(updated);
    return updated;
  }
}
