import type { Target } from '../../domain/target/Target.js';

export interface TargetRepository {
  save(target: Target): Promise<void>;
  findById(id: string): Promise<Target | null>;
  findAll(): Promise<readonly Target[]>;
}
