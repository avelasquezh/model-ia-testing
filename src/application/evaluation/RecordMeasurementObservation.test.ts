import { describe, expect, it } from 'vitest';
import { EvidenceUnit } from '../../domain/evaluation/EvidenceUnit.js';
import { MeasurementDefinition } from '../../domain/evaluation/MeasurementDefinition.js';
import { RecordMeasurementObservation } from './RecordMeasurementObservation.js';

const definition = new MeasurementDefinition({
  id: 'D6-C01-M01',
  name: 'Tiempo hasta respuesta observable',
  objective: 'Medir el tiempo observable hasta la respuesta del sistema',
  unit: 'ms',
  source: 'response observation',
  conditions: 'single conversational turn',
  interpretationRule: 'preserve observed value for later evaluation',
  limitations: 'does not represent internal model inference time',
  version: 1,
});

const evidence = (id: string, runId = 'execution-1') =>
  new EvidenceUnit({
    id,
    runId,
    scenarioId: 'scenario-1',
    stepId: 'step-1',
    timestamp: new Date('2026-09-06T18:00:00.000Z'),
    evidenceType: 'TIMING',
    source: 'playwright',
    contentReference: `artifacts/${id}.json`,
    captureMethod: 'adapter',
  });

describe('RecordMeasurementObservation', () => {
  const ids = { generate: () => 'measurement-1' };
  const recorder = new RecordMeasurementObservation(ids);

  it('links a measurement to its definition, execution and primary evidence', () => {
    const observation = recorder.execute({
      definition,
      executionId: 'execution-1',
      evidence: [evidence('evidence-1')],
      value: 420,
      measuredAt: new Date('2026-09-06T18:00:01.000Z'),
    });

    expect(observation.props).toEqual({
      id: 'measurement-1',
      measurementDefinitionId: 'D6-C01-M01',
      executionId: 'execution-1',
      evidenceIds: ['evidence-1'],
      value: 420,
      measuredAt: new Date('2026-09-06T18:00:01.000Z'),
    });
  });

  it('accepts multiple evidence units from the same execution', () => {
    const observation = recorder.execute({
      definition,
      executionId: 'execution-1',
      evidence: [evidence('evidence-1'), evidence('evidence-2')],
      value: 420,
      measuredAt: new Date('2026-09-06T18:00:01.000Z'),
    });

    expect(observation.props.evidenceIds).toEqual(['evidence-1', 'evidence-2']);
  });

  it('rejects evidence from another execution', () => {
    expect(() =>
      recorder.execute({
        definition,
        executionId: 'execution-1',
        evidence: [evidence('evidence-3', 'execution-2')],
        value: 420,
        measuredAt: new Date('2026-09-06T18:00:01.000Z'),
      }),
    ).toThrow('Measurement observation evidence must belong to the execution');
  });

  it('rejects duplicated evidence references', () => {
    const duplicate = evidence('evidence-4');

    expect(() =>
      recorder.execute({
        definition,
        executionId: 'execution-1',
        evidence: [duplicate, duplicate],
        value: 420,
        measuredAt: new Date('2026-09-06T18:00:01.000Z'),
      }),
    ).toThrow('Measurement observation evidence ids must be unique');
  });

  it('requires at least one evidence unit', () => {
    expect(() =>
      recorder.execute({
        definition,
        executionId: 'execution-1',
        evidence: [],
        value: 420,
        measuredAt: new Date('2026-09-06T18:00:01.000Z'),
      }),
    ).toThrow('Measurement observation requires evidence');
  });
});
