import { describe, expect, it } from 'vitest';
import { CreateSuite } from './CreateSuite.js';
import { Suite } from '../../domain/suite/Suite.js';
import { InMemorySuiteRepository } from '../../infrastructure/persistence/InMemorySuiteRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';

class FixedIdGenerator implements IdGenerator {
  public constructor(private readonly id: string) {}

  public generate(): string {
    return this.id;
  }
}

describe('Suite management', () => {
  it('creates and stores a suite with scenarios', async () => {
    const repository = new InMemorySuiteRepository();
    const service = new CreateSuite(repository, new FixedIdGenerator('suite-001'));

    const suite = await service.execute({
      name: 'Checkout regression',
      scenarioIds: ['scenario-001', 'scenario-002'],
    });

    expect(suite).toBeInstanceOf(Suite);
    expect(suite.props).toEqual({
      id: 'suite-001',
      name: 'Checkout regression',
      scenarioIds: ['scenario-001', 'scenario-002'],
    });
    await expect(repository.findById('suite-001')).resolves.toBe(suite);
  });

  it('rejects a suite without scenarios', () => {
    expect(() => new Suite({ id: 'suite-001', name: 'Empty', scenarioIds: [] })).toThrow(
      'Suite must contain at least one scenario',
    );
  });

  it('rejects duplicate scenario identifiers', () => {
    expect(
      () => new Suite({ id: 'suite-001', name: 'Duplicate', scenarioIds: ['scenario-001', 'scenario-001'] }),
    ).toThrow('Suite scenario ids must be unique');
  });
});
