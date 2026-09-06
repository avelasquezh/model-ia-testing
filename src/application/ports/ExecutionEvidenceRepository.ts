import type { ExecutionEvidence } from '../../domain/evidence/ExecutionEvidence.js';

export interface ExecutionEvidenceRepository {
  save(evidence: ExecutionEvidence): Promise<void>;
  findByExecutionId(executionId: string): Promise<ExecutionEvidence | undefined>;
}
