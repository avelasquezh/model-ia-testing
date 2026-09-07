import type { EvaluationEvidence, EvidenceCatalog } from '../../application/ports/EvidenceCatalog.js';

export class InMemoryEvidenceCatalog implements EvidenceCatalog {
  public constructor(private readonly evidence: readonly EvaluationEvidence[]) {}

  public async findByExecutionId(executionId: string): Promise<readonly EvaluationEvidence[]> {
    return this.evidence.filter((item) => item.executionId === executionId);
  }
}
