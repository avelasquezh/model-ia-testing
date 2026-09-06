import { Suite } from '../../domain/suite/Suite.js';
import type { SuiteRepository } from '../../application/ports/SuiteRepository.js';

export class InMemorySuiteRepository implements SuiteRepository {
  private readonly suites = new Map<string, Suite>();

  public async save(suite: Suite): Promise<void> {
    this.suites.set(suite.props.id, suite);
  }

  public async findById(id: string): Promise<Suite | undefined> {
    return this.suites.get(id);
  }
}
