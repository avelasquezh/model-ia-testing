import { Suite } from '../../domain/suite/Suite.js';

export interface SuiteRepository {
  save(suite: Suite): Promise<void>;
  findById(id: string): Promise<Suite | undefined>;
}
