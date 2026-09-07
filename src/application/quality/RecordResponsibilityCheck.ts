import { ResponsibilityCheck, type ResponsibilityViolation } from '../../domain/quality/ResponsibilityCheck.js';
import type { QualityCheckRepository } from '../ports/QualityCheckRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';

export type RecordResponsibilityCheckInput = {
  readonly targetComponent: string;
  readonly externalDependencies?: readonly string[];
  readonly violations?: readonly ResponsibilityViolation[];
};

export class RecordResponsibilityCheck {
  public constructor(
    private readonly checks: QualityCheckRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: RecordResponsibilityCheckInput): Promise<ResponsibilityCheck> {
    const check = new ResponsibilityCheck({
      id: this.ids.generate(),
      targetComponent: input.targetComponent,
      externalDependencies: input.externalDependencies ?? [],
      violations: input.violations ?? [],
    });

    await this.checks.save(check);
    return check;
  }
}
