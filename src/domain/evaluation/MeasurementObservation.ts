export type MeasurementValue = number | string | boolean;

export type MeasurementObservationProps = {
  readonly id: string;
  readonly measurementDefinitionId: string;
  readonly executionId: string;
  readonly evidenceIds: readonly string[];
  readonly value: MeasurementValue;
  readonly measuredAt: Date;
  readonly metadata?: Readonly<Record<string, string>>;
};

export class MeasurementObservation {
  public constructor(public readonly props: MeasurementObservationProps) {
    if (!props.id.trim()) throw new Error('Measurement observation id is required');
    if (!props.measurementDefinitionId.trim()) {
      throw new Error('Measurement observation definition id is required');
    }
    if (!props.executionId.trim()) {
      throw new Error('Measurement observation execution id is required');
    }
    if (props.evidenceIds.length === 0) {
      throw new Error('Measurement observation requires at least one evidence id');
    }
    if (props.evidenceIds.some((id) => !id.trim())) {
      throw new Error('Measurement observation evidence ids are required');
    }
    if (typeof props.value === 'number' && !Number.isFinite(props.value)) {
      throw new Error('Measurement observation numeric value must be finite');
    }
    if (!props.measuredAt || Number.isNaN(props.measuredAt.getTime())) {
      throw new Error('Measurement observation time must be a valid date');
    }
  }
}
