import type { RequirementTraceRepository } from '../../application/ports/RequirementTraceRepository.js';
import type { RequirementTrace } from '../../domain/traceability/RequirementTrace.js';

export class InMemoryRequirementTraceRepository implements RequirementTraceRepository {
  private readonly traces = new Map<string, RequirementTrace>();

  public async save(trace: RequirementTrace): Promise<void> {
    this.traces.set(trace.props.requirementId, trace);
  }

  public async findByRequirementId(requirementId: string): Promise<RequirementTrace | undefined> {
    return this.traces.get(requirementId);
  }
}
