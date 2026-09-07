import { describe, expect, it } from 'vitest';
import { EvaluationMethodology, EVALUATION_OUTCOMES } from './EvaluationMethodology.js';

const dimension = {
  id: 'D1',
  name: 'Corrección funcional observable',
  objective: 'Determinar si el comportamiento esperado ocurre.',
} as const;

const criterion = {
  id: 'D1-C01',
  dimensionId: 'D1',
  type: 'BOOLEAN' as const,
  objective: 'Verificar la respuesta funcional esperada.',
  preconditions: ['El escenario está disponible.'],
  input: 'Solicitud válida reproducible.',
  expected: 'El bot responde según la especificación.',
  requiredEvidence: ['TRANSCRIPT'] as const,
  decisionRule: 'PASS si todos los resultados esperados se cumplen; FAIL si existe incumplimiento probado.',
  limitations: ['No determina propiedades internas del bot.'],
  version: '1.0',
} as const;

describe('EvaluationMethodology', () => {
  it('accepts a complete observable criterion contract', () => {
    const methodology = new EvaluationMethodology({
      id: 'observable-mvp',
      version: '1.0',
      status: 'DRAFT',
      dimensions: [dimension],
      criteria: [criterion],
    });

    expect(methodology.dimensionCriteria('D1')).toHaveLength(1);
    expect(EVALUATION_OUTCOMES).toEqual([
      'PASS',
      'FAIL',
      'PARTIAL',
      'INCONCLUSIVE',
      'NOT_EVALUABLE',
    ]);
  });

  it('rejects criteria that reference an unknown dimension', () => {
    expect(
      () =>
        new EvaluationMethodology({
          id: 'observable-mvp',
          version: '1.0',
          status: 'DRAFT',
          dimensions: [dimension],
          criteria: [{ ...criterion, dimensionId: 'D9' }],
        }),
    ).toThrow('references unknown dimension');
  });

  it('rejects duplicate dimension identifiers', () => {
    expect(
      () =>
        new EvaluationMethodology({
          id: 'observable-mvp',
          version: '1.0',
          status: 'DRAFT',
          dimensions: [dimension, dimension],
          criteria: [criterion],
        }),
    ).toThrow('Duplicate methodology dimension');
  });

  it('requires a measurement method for numeric criteria', () => {
    expect(
      () =>
        new EvaluationMethodology({
          id: 'observable-mvp',
          version: '1.0',
          status: 'DRAFT',
          dimensions: [dimension],
          criteria: [{ ...criterion, type: 'NUMERIC', measurementMethod: undefined }],
        }),
    ).toThrow('must declare a measurement method');
  });

  it('rejects incomplete evidence declarations', () => {
    expect(
      () =>
        new EvaluationMethodology({
          id: 'observable-mvp',
          version: '1.0',
          status: 'DRAFT',
          dimensions: [dimension],
          criteria: [{ ...criterion, requiredEvidence: [] }],
        }),
    ).toThrow('must declare at least one required evidence type');
  });
});
