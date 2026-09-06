import type { Evidence, EvidencePort } from '../application/ports/EvidencePort.js';

export class InMemoryEvidenceAdapter implements EvidencePort {
  public readonly evidence: Evidence[] = [];

  public async capture(item: Evidence): Promise<void> {
    this.evidence.push(item);
  }
}
