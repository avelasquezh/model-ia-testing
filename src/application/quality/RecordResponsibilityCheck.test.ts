import { describe, expect, it } from 'vitest';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { QualityCheckRepository } from '../ports/QualityCheckRepository.js';
import type { ResponsibilityCheck } from '../../domain/quality/ResponsibilityCheck.js';
import { RecordResponsibilityCheck } from './RecordResponsibilityCheck.js';

class TestRepository implements QualityCheckRepository {
  public saved?: ResponsibilityCheck;
  public async save(check: ResponsibilityCheck): Promise<void> { this.saved = check; }
  public async findById(id: string): Promise<ResponsibilityCheck | undefined> {
    return this.saved?.props.id === id ? this.saved : undefined;
  }
}

class TestIdGenerator implements IdGenerator {
  public generate(): string { return 'quality-1'; }
}

describe('RecordResponsibilityCheck', () => {
  it('records a passing responsibility check', async () => {
    const repository = new TestRepository();
    const useCase = new RecordResponsibilityCheck(repository, new TestIdGenerator());
    const check = await useCase.execute({
      targetComponent: 'application.execution',
      externalDependencies: ['ExecutionRepository', 'ExecutionRunner'],
    });

    expect(check.props.id).toBe('quality-1');
    expect(check.passed).toBe(true);
    expect(repository.saved).toBe(check);
  });

  it('records architectural violations without interpreting severity', async () => {
    const repository = new TestRepository();
    const useCase = new RecordResponsibilityCheck(repository, new TestIdGenerator());
    const check = await useCase.execute({
      targetComponent: 'domain.execution',
      violations: [{
        rule: 'Dependency direction',
        message: 'Domain imports infrastructure implementation',
        component: 'domain.execution',
      }],
    });

    expect(check.passed).toBe(false);
    expect(check.props.violations).toHaveLength(1);
    expect(check.props.violations[0]?.rule).toBe('Dependency direction');
  });
});
