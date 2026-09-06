import { RequirementTrace } from '../../domain/traceability/RequirementTrace.js';
import type { RequirementTraceRepository } from '../ports/RequirementTraceRepository.js';

export type RegisterRequirementTraceInput = {
  readonly requirementId: string;
  readonly scenarioIds?: readonly string[];
  readonly executionIds?: readonly string[];
  readonly resultIds?: readonly string[];
  readonly findingIds?: readonly string[];
  readonly reportIds?: readonly string[];
};

export class RegisterRequirementTrace {
  public constructor(private readonly traces: RequirementTraceRepository) {}

  public async execute(input: RegisterRequirementTraceInput): Promise<RequirementTrace> {
    const trace = new RequirementTrace({
      requirementId: input.requirementId,
      scenarioIds: input.scenarioIds ?? [],
      executionIds: input.executionIds ?? [],
      resultIds: input.resultIds ?? [],
      findingIds: input.findingIds ?? [],
      reportIds: input.reportIds ?? [],
      coverageStatus: (input.scenarioIds?.length ?? 0) > 0 ? 'COVERED' : 'UNCOVERED',
    });

    await this.traces.save(trace);
    return trace;
  }
}
