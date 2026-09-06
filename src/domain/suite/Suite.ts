export type SuiteProps = {
  readonly id: string;
  readonly name: string;
  readonly scenarioIds: readonly string[];
};

export class Suite {
  public constructor(public readonly props: SuiteProps) {
    if (!props.id.trim()) throw new Error('Suite id is required');
    if (!props.name.trim()) throw new Error('Suite name is required');
    if (props.scenarioIds.length === 0) throw new Error('Suite must contain at least one scenario');
    if (new Set(props.scenarioIds).size !== props.scenarioIds.length) {
      throw new Error('Suite scenario ids must be unique');
    }
    if (props.scenarioIds.some((scenarioId) => !scenarioId.trim())) {
      throw new Error('Suite scenario id is required');
    }
  }
}
