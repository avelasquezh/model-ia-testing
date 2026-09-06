import { describe, expect, it } from 'vitest';
import { Target } from '../../domain/target/Target.js';
import { ChangeTargetStatus } from './ChangeTargetStatus.js';
import { RegisterTarget } from './RegisterTarget.js';
import { ValidateTargetAvailability } from './ValidateTargetAvailability.js';
import { InMemoryTargetRepository } from '../../infrastructure/persistence/InMemoryTargetRepository.js';

const ids = { generate: () => 'target-001' };

describe('Target management', () => {
  it('registers an active target with a valid URL', async () => {
    const repository = new InMemoryTargetRepository();
    const useCase = new RegisterTarget(repository, ids);

    const target = await useCase.execute({ name: 'Demo bot', url: 'https://example.com/chat' });

    expect(target.props).toEqual({
      id: 'target-001',
      name: 'Demo bot',
      url: 'https://example.com/chat',
      status: 'ACTIVE',
    });
  });

  it('rejects invalid target URLs', async () => {
    const repository = new InMemoryTargetRepository();
    const useCase = new RegisterTarget(repository, ids);

    await expect(useCase.execute({ name: 'Demo bot', url: 'ftp://example.com' }))
      .rejects.toThrow('Target URL must use HTTP or HTTPS');
  });

  it('changes the lifecycle status', async () => {
    const repository = new InMemoryTargetRepository();
    await repository.save(new Target({
      id: 'target-001', name: 'Demo bot', url: 'https://example.com', status: 'ACTIVE',
    }));
    const useCase = new ChangeTargetStatus(repository);

    const inactive = await useCase.deactivate('target-001');
    const active = await useCase.activate('target-001');

    expect(inactive.props.status).toBe('INACTIVE');
    expect(active.props.status).toBe('ACTIVE');
  });

  it('validates availability only for active targets', async () => {
    const repository = new InMemoryTargetRepository();
    await repository.save(new Target({
      id: 'target-001', name: 'Demo bot', url: 'https://example.com', status: 'INACTIVE',
    }));
    const availability = { isAvailable: async () => true };
    const useCase = new ValidateTargetAvailability(repository, availability);

    const result = await useCase.execute('target-001');

    expect(result.available).toBe(false);
  });
});
