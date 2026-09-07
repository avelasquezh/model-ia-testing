export type CoverageStatus = 'COVERED' | 'UNCOVERED';

export type RequirementTraceProps = {
  readonly requirementId: string;
  readonly scenarioIds: readonly string[];
  readonly executionIds: readonly string[];
  readonly resultIds: readonly string[];
  readonly findingIds: readonly string[];
  readonly reportIds: readonly string[];
  readonly coverageStatus: CoverageStatus;
};

export class RequirementTrace {
  public constructor(public readonly props: RequirementTraceProps) {
    if (!props.requirementId.trim()) throw new Error('Requirement id is required');

    for (const [name, values] of Object.entries({
      scenarioIds: props.scenarioIds,
      executionIds: props.executionIds,
      resultIds: props.resultIds,
      findingIds: props.findingIds,
      reportIds: props.reportIds,
    })) {
      if (values.some((value) => !value.trim())) {
        throw new Error(`Traceability ${name} cannot contain blank ids`);
      }
      if (new Set(values).size !== values.length) {
        throw new Error(`Traceability ${name} cannot contain duplicate ids`);
      }
    }

    const covered = props.scenarioIds.length > 0;
    const expectedStatus: CoverageStatus = covered ? 'COVERED' : 'UNCOVERED';
    if (props.coverageStatus !== expectedStatus) {
      throw new Error(`Traceability coverage status must be ${expectedStatus}`);
    }
  }
}
