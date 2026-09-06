import { describe, expect, it } from 'vitest';
import { MeasurementDefinition } from './MeasurementDefinition.js';

describe('MeasurementDefinition', () => {
  const validProps = {
    id: 'D6-C01-M01',
    name: 'Time to first observable response',
    objective: 'Measure elapsed observable time until the first response signal',
    unit: 'ms',
    source: 'Conversation interaction timestamps',
    conditions: 'Single scenario turn under the configured execution environment',
    interpretationRule: 'Interpret only against an explicitly defined threshold or baseline',
    limitations: 'Does not represent internal model inference time',
    version: 1,
  };

  it('creates a valid numeric measurement definition', () => {
    const definition = new MeasurementDefinition(validProps);

    expect(definition.props).toEqual(validProps);
  });

  it('allows an optional formula', () => {
    const definition = new MeasurementDefinition({
      ...validProps,
      formula: 'firstResponseAt - inputSentAt',
    });

    expect(definition.props.formula).toBe('firstResponseAt - inputSentAt');
  });

  it.each([
    ['id', { id: '' }, 'Measurement definition id is required'],
    ['name', { name: ' ' }, 'Measurement definition name is required'],
    ['objective', { objective: '' }, 'Measurement definition objective is required'],
    ['unit', { unit: ' ' }, 'Measurement definition unit is required'],
    ['source', { source: '' }, 'Measurement definition source is required'],
    ['conditions', { conditions: ' ' }, 'Measurement definition conditions are required'],
    ['interpretation rule', { interpretationRule: '' }, 'Measurement definition interpretation rule is required'],
    ['limitations', { limitations: ' ' }, 'Measurement definition limitations are required'],
    ['version', { version: 0 }, 'Measurement definition version must be a positive integer'],
    ['formula', { formula: ' ' }, 'Measurement definition formula cannot be empty'],
  ])('rejects invalid %s', (_field, override, message) => {
    expect(() => new MeasurementDefinition({ ...validProps, ...override })).toThrow(message);
  });
});
