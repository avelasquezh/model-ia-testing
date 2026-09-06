import type { ResponsibilityCheck } from '../../domain/quality/ResponsibilityCheck.js';

export interface QualityCheckRepository {
  save(check: ResponsibilityCheck): Promise<void>;
  findById(id: string): Promise<ResponsibilityCheck | undefined>;
}
