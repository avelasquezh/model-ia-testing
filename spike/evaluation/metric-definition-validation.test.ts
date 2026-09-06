import { describe, expect, it } from 'vitest';

type MetricType = 'BOOLEAN' | 'ORDINAL' | 'NUMERIC' | 'COMPARATIVE';

type MetricDefinition = {
  readonly id: string;
  readonly name: string;
  readonly objective: string;
  readonly unit: string;
  readonly type: MetricType;
  readonly sourceEvidenceTypes: readonly string[];
  readonly formula?: string;
  readonly version: number;
};

const metricCatalog: readonly MetricDefinition[] = [
  {
    id: 'M-D1-RESPONSE-COMPLIANCE',
    name: 'Cumplimiento de respuesta esperada',
    objective: 'Medir cumplimiento observable de los resultados esperados.',
    unit: 'proportion',
    type: 'NUMERIC',
    sourceEvidenceTypes: ['TRANSCRIPT'],
    formula: 'fulfilled_expected_items / applicable_expected_items',
    version: 1,
  },
  {
    id: 'M-D2-RELEVANCE',
    name: 'Relevancia de respuesta',
    objective: 'Representar el nivel ordinal de relevancia frente a la intención.',
    unit: 'ordinal-level',
    type: 'ORDINAL',
    sourceEvidenceTypes: ['TRANSCRIPT'],
    version: 1,
  },
  {
    id: 'M-D3-CONTEXT-CONSISTENCY',
    name: 'Consistencia contextual',
    objective: 'Medir proporción de comprobaciones contextuales satisfechas.',
    unit: 'proportion',
    type: 'NUMERIC',
    sourceEvidenceTypes: ['TRANSCRIPT'],
    formula: 'satisfied_context_checks / applicable_context_checks',
    version: 1,
  },
  {
    id: 'M-D4-RECOVERY',
    name: 'Recuperación conversacional',
    objective: 'Medir si una interacción puede recuperar el flujo esperado.',
    unit: 'boolean',
    type: 'BOOLEAN',
    sourceEvidenceTypes: ['TRANSCRIPT', 'INTERACTION'],
    version: 1,
  },
  {
    id: 'M-D5-RESPONSIBLE-BEHAVIOR',
    name: 'Comportamiento responsable observable',
    objective: 'Medir cumplimiento de una regla responsable definida para el escenario.',
    unit: 'boolean',
    type: 'BOOLEAN',
    sourceEvidenceTypes: ['TRANSCRIPT'],
    version: 1,
  },
  {
    id: 'M-D6-FIRST-RESPONSE-TIME',
    name: 'Tiempo hasta primera respuesta observable',
    objective: 'Medir el tiempo observable entre el envío y la primera respuesta.',
    unit: 'milliseconds',
    type: 'NUMERIC',
    sourceEvidenceTypes: ['TIMING', 'TRANSCRIPT'],
    formula: 'first_observable_response_at - input_sent_at',
    version: 1,
  },
  {
    id: 'M-D6-FULL-RESPONSE-TIME',
    name: 'Tiempo hasta respuesta completa',
    objective: 'Medir el tiempo observable hasta completar la respuesta.',
    unit: 'milliseconds',
    type: 'NUMERIC',
    sourceEvidenceTypes: ['TIMING', 'TRANSCRIPT'],
    formula: 'full_response_at - input_sent_at',
    version: 1,
  },
  {
    id: 'M-D7-RESPONSE-VISIBILITY',
    name: 'Visibilidad de respuesta',
    objective: 'Determinar si la respuesta es observable en la interfaz.',
    unit: 'boolean',
    type: 'BOOLEAN',
    sourceEvidenceTypes: ['DOM', 'SCREENSHOT', 'TRANSCRIPT'],
    version: 1,
  },
];

const requiredFields = (metric: MetricDefinition): boolean =>
  Boolean(
    metric.id.trim() &&
      metric.name.trim() &&
      metric.objective.trim() &&
      metric.unit.trim() &&
      metric.sourceEvidenceTypes.length > 0 &&
      Number.isInteger(metric.version) &&
      metric.version >= 1,
  );

describe('F2-15 metric definition methodological validation', () => {
  it('requires an explicit definition contract for every candidate metric', () => {
    for (const metric of metricCatalog) {
      expect(requiredFields(metric)).toBe(true);
    }
  });

  it('uses units that match the metric type and observable meaning', () => {
    const numericMetrics = metricCatalog.filter((metric) => metric.type === 'NUMERIC');
    const booleanMetrics = metricCatalog.filter((metric) => metric.type === 'BOOLEAN');
    const ordinalMetrics = metricCatalog.filter((metric) => metric.type === 'ORDINAL');

    expect(numericMetrics.every((metric) =>
      ['milliseconds', 'proportion'].includes(metric.unit),
    )).toBe(true);
    expect(booleanMetrics.every((metric) => metric.unit === 'boolean')).toBe(true);
    expect(ordinalMetrics.every((metric) => metric.unit === 'ordinal-level')).toBe(true);
  });

  it('requires formulas for derived numeric metrics and preserves their source evidence', () => {
    const derived = metricCatalog.filter((metric) => metric.type === 'NUMERIC');

    for (const metric of derived) {
      expect(metric.formula?.trim()).toBeTruthy();
      expect(metric.sourceEvidenceTypes.length).toBeGreaterThan(0);
    }
  });

  it('keeps observable timing metrics separate from internal model inference time', () => {
    const timingMetrics = metricCatalog.filter((metric) => metric.unit === 'milliseconds');

    expect(timingMetrics).toHaveLength(2);
    expect(timingMetrics.every((metric) =>
      metric.formula?.includes('input_sent_at') &&
      !metric.formula?.includes('model_inference'),
    )).toBe(true);
  });

  it('supports comparative measurement without silently defining acceptance thresholds', () => {
    const comparativeMetric: MetricDefinition = {
      id: 'M-COMPARATIVE-EXAMPLE',
      name: 'Cambio respecto a baseline',
      objective: 'Describir la diferencia observable respecto a una referencia compatible.',
      unit: 'relative-change',
      type: 'COMPARATIVE',
      sourceEvidenceTypes: ['TIMING'],
      formula: '(current - baseline) / baseline',
      version: 1,
    };

    expect(requiredFields(comparativeMetric)).toBe(true);
    expect(comparativeMetric.formula).toContain('baseline');
  });

  it('does not make the metric definition itself an acceptance decision', () => {
    for (const metric of metricCatalog) {
      expect(metric).not.toHaveProperty('threshold');
      expect(metric).not.toHaveProperty('acceptanceRule');
      expect(metric).not.toHaveProperty('globalScoreWeight');
    }
  });
});
