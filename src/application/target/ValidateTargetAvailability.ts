import type { TargetRepository } from '../ports/TargetRepository.js';
import type { TargetAvailabilityPort } from '../ports/TargetPorts.js';

export type AvailabilityResult = {
  readonly targetId: string;
  readonly url: string;
  readonly available: boolean;
};

export class ValidateTargetAvailability {
  public constructor(
    private readonly repository: TargetRepository,
    private readonly availability: TargetAvailabilityPort,
  ) {}

  public async execute(id: string): Promise<AvailabilityResult> {
    const target = await this.repository.findById(id);
    if (!target) throw new Error(`Target not found: ${id}`);
    if (target.props.status !== 'ACTIVE') {
      return { targetId: id, url: target.props.url, available: false };
    }

    return {
      targetId: id,
      url: target.props.url,
      available: await this.availability.isAvailable(target.props.url),
    };
  }
}
