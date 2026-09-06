import type { RequirementTrace } from '../../domain/traceability/RequirementTrace.js';

export interface RequirementTraceRepository {
  save(trace: RequirementTrace): Promise<void>;
  findByRequirementId(requirementId: string): Promise<RequirementTrace | undefined>;
}
