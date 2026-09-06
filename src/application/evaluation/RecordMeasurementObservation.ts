import { MeasurementObservation, type MeasurementValue } from '../../domain/evaluation/MeasurementObservation.js';
import type { EvidenceUnit } from '../../domain/evaluation/EvidenceUnit.js';
import type { MeasurementDefinition } from '../../domain/evaluation/MeasurementDefinition.js';
import type { IdGenerator } from '../ports/TargetPorts.js';

export type RecordMeasurementObservationInput = {
  readonly definition: MeasurementDefinition;
  readonly executionId: string;
  readonly evidence: readonly EvidenceUnit[];
  readonly value: MeasurementValue;
  readonly measuredAt: Date;
  readonly metadata?: Readonly<Record<string, string>>;
};

export class RecordMeasurementObservation {
  public constructor(private readonly ids: IdGenerator) {}

  public execute(input: RecordMeasurementObservationInput): MeasurementObservation {
    if (!input.executionId.trim()) {
      throw new Error('Measurement observation execution id is required');
    }
    if (input.evidence.length === 0) {
      throw new Error('Measurement observation requires evidence');
    }

    const evidenceIds = input.evidence.map((evidence) => evidence.props.id);
    const uniqueEvidenceIds = new Set(evidenceIds);
    if (uniqueEvidenceIds.size !== evidenceIds.length) {
      throw new Error('Measurement observation evidence ids must be unique');
    }

    const unrelatedEvidence = input.evidence.find(
      (evidence) => evidence.props.runId !== input.executionId,
    );
    if (unrelatedEvidence) {
      throw new Error('Measurement observation evidence must belong to the execution');
    }

    return new MeasurementObservation({
      id: this.ids.generate(),
      measurementDefinitionId: input.definition.props.id,
      executionId: input.executionId,
      evidenceIds,
      value: input.value,
      measuredAt: input.measuredAt,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    });
  }
}
