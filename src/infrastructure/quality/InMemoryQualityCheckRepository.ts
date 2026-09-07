import type { QualityCheckRepository } from '../../application/ports/QualityCheckRepository.js';
import type { ResponsibilityCheck } from '../../domain/quality/ResponsibilityCheck.js';

export class InMemoryQualityCheckRepository implements QualityCheckRepository {
  private readonly checks = new Map<string, ResponsibilityCheck>();

  public async save(check: ResponsibilityCheck): Promise<void> {
    this.checks.set(check.props.id, check);
  }

  public async findById(id: string): Promise<ResponsibilityCheck | undefined> {
    return this.checks.get(id);
  }
}
