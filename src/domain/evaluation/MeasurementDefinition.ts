export type MeasurementDefinitionProps = {
  readonly id: string;
  readonly name: string;
  readonly objective: string;
  readonly unit: string;
  readonly formula?: string;
  readonly source: string;
  readonly conditions: string;
  readonly interpretationRule: string;
  readonly limitations: string;
  readonly version: number;
};

export class MeasurementDefinition {
  public constructor(public readonly props: MeasurementDefinitionProps) {
    if (!props.id.trim()) throw new Error('Measurement definition id is required');
    if (!props.name.trim()) throw new Error('Measurement definition name is required');
    if (!props.objective.trim()) throw new Error('Measurement definition objective is required');
    if (!props.unit.trim()) throw new Error('Measurement definition unit is required');
    if (!props.source.trim()) throw new Error('Measurement definition source is required');
    if (!props.conditions.trim()) throw new Error('Measurement definition conditions are required');
    if (!props.interpretationRule.trim()) {
      throw new Error('Measurement definition interpretation rule is required');
    }
    if (!props.limitations.trim()) {
      throw new Error('Measurement definition limitations are required');
    }
    if (!Number.isInteger(props.version) || props.version < 1) {
      throw new Error('Measurement definition version must be a positive integer');
    }
    if (props.formula !== undefined && !props.formula.trim()) {
      throw new Error('Measurement definition formula cannot be empty');
    }
  }
}
