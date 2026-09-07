import type { Execution } from '../../domain/execution/Execution.js';
import type { ExecutionRepository } from '../../application/ports/ExecutionRepository.js';

export class InMemoryExecutionRepository implements ExecutionRepository {
  private readonly items = new Map<string, Execution>();

  public async save(execution: Execution): Promise<void> {
    this.items.set(execution.props.id, execution);
  }

  public async findById(id: string): Promise<Execution | null> {
    return this.items.get(id) ?? null;
  }
}
