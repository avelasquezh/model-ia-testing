import type { ExecutionEvidenceRepository } from '../../application/ports/ExecutionEvidenceRepository.js';
import type { ExecutionEvidence } from '../../domain/evidence/ExecutionEvidence.js';

export class InMemoryExecutionEvidenceRepository implements ExecutionEvidenceRepository {
  private readonly evidence = new Map<string, ExecutionEvidence>();

  public async save(value: ExecutionEvidence): Promise<void> {
    this.evidence.set(value.props.id, value);
  }

  public async findByExecutionId(executionId: string): Promise<ExecutionEvidence | undefined> {
    for (const value of this.evidence.values()) {
      if (value.props.executionId === executionId) return value;
    }
    return undefined;
  }
}
