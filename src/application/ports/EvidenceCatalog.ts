import type { CriterionEvidenceType } from '../../domain/evaluation/Criterion.js';

export type EvaluationEvidence = {
  readonly id: string;
  readonly executionId: string;
  readonly evidenceType: CriterionEvidenceType;
  readonly contentReference: string;
};

export interface EvidenceCatalog {
  findByExecutionId(executionId: string): Promise<readonly EvaluationEvidence[]>;
}
