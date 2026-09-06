import type { Execution } from '../../domain/execution/Execution.js';

export interface ExecutionRepository {
  save(execution: Execution): Promise<void>;
  findById(id: string): Promise<Execution | null>;
}
