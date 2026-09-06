import { describe, expect, it } from 'vitest';
import { MeasurementObservation } from './MeasurementObservation.js';

describe('MeasurementObservation', () => {
  const validProps = {
    id: 'measurement-1',
    measurementDefinitionId: 'D6-C01-M01',
    executionId: 'execution-1',
    evidenceIds: ['evidence-1'],
    value: 420,
    measuredAt: new Date('2026-09-06T18:00:00.000Z'),
  };

  it('creates a numeric observation linked to execution and evidence', () => {
    const observation = new MeasurementObservation(validProps);

    expect(observation.props).toEqual(validProps);
  });

  it.each([
    ['id', { id: ' ' }, 'Measurement observation id is required'],
    ['definition id', { measurementDefinitionId: '' }, 'Measurement observation definition id is required'],
    ['execution id', { executionId: ' ' }, 'Measurement observation execution id is required'],
    ['evidence', { evidenceIds: [] }, 'Measurement observation requires at least one evidence id'],
    ['evidence id', { evidenceIds: [''] }, 'Measurement observation evidence ids are required'],
    ['numeric value', { value: Number.NaN }, 'Measurement observation numeric value must be finite'],
    ['timestamp', { measuredAt: new Date('invalid') }, 'Measurement observation time must be a valid date'],
  ])('rejects invalid %s', (_field, override, message) => {
    expect(() => new MeasurementObservation({ ...validProps, ...override })).toThrow(message);
  });

  it('accepts boolean and textual observations', () => {
    expect(
      new MeasurementObservation({
        ...validProps,
        id: 'measurement-2',
        value: true,
      }).props.value,
    ).toBe(true);

    expect(
      new MeasurementObservation({
        ...validProps,
        id: 'measurement-3',
        value: 'high',
      }).props.value,
    ).toBe('high');
  });

  it('preserves optional metadata without changing the measurement value', () => {
    const observation = new MeasurementObservation({
      ...validProps,
      metadata: {
        browser: 'chromium',
        viewport: '1280x720',
      },
    });

    expect(observation.props.value).toBe(420);
    expect(observation.props.metadata).toEqual({
      browser: 'chromium',
      viewport: '1280x720',
    });
  });
});
