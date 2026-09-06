import type {
  ExecutionEvidenceEvent,
  ExecutionEvidencePublisher,
} from '../../application/ports/ExecutionEvidencePublisher.js';

export class InMemoryExecutionEvidencePublisher implements ExecutionEvidencePublisher {
  public readonly events: ExecutionEvidenceEvent[] = [];

  public async publish(event: ExecutionEvidenceEvent): Promise<void> {
    this.events.push(event);
  }
}
