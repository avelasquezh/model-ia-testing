import { describe, expect, it } from 'vitest';
import { CompareSemanticModelResults } from './CompareSemanticModelResults.js';
import type { EvaluationOutcome } from '../../domain/evaluation/EvaluationMethodology.js';

const observation = (
  caseId: string,
  repetition: number,
  outcome: EvaluationOutcome,
) => ({
  caseId,
  repetition,
  turn: 1,
  conversationId: `conversation-${caseId}-${repetition}`,
  outcome,
  evidenceInsufficient: false,
  evidenceIds: [`evidence-${caseId}-${repetition}`],
});

describe('CompareSemanticModelResults', () => {
  it('compares identical observation keys and preserves per-model evidence', () => {
    const result = new CompareSemanticModelResults().compare([
      {
        model: { modelId: 'gpt-5.6-terra', modelVersion: 'v1' },
        results: [observation('ALIGNED', 1, 'PASS'), observation('NOT_ALIGNED', 1, 'FAIL')],
      },
      {
        model: { modelId: 'claude-sonnet-5', modelVersion: 'v1' },
        results: [observation('ALIGNED', 1, 'PASS'), observation('NOT_ALIGNED', 1, 'PARTIAL')],
      },
    ]);

    expect(result.status).toBe('COMPARISON_COMPLETED');
    expect(result.summary.totalCases).toBe(2);
    expect(result.summary.agreements).toBe(1);
    expect(result.summary.disagreements).toBe(1);
    expect(result.summary.agreementRate).toBe(0.5);

    const notAligned = result.comparisons.find((comparison) => comparison.caseId === 'NOT_ALIGNED');
    expect(notAligned).toBeDefined();
    expect(notAligned?.agreement).toBe('DISAGREEMENT');
    expect(notAligned?.models[0]?.evidenceIds).toEqual(['evidence-NOT_ALIGNED-1']);
  });

  it('rejects result sets with missing observation keys', () => {
    expect(() => new CompareSemanticModelResults().compare([
      {
        model: { modelId: 'model-a', modelVersion: '1' },
        results: [observation('ALIGNED', 1, 'PASS')],
      },
      {
        model: { modelId: 'model-b', modelVersion: '1' },
        results: [observation('NOT_ALIGNED', 1, 'FAIL')],
      },
    ])).toThrow('Semantic model result sets are not aligned');
  });

  it('rejects duplicate observation keys for one model', () => {
    const duplicate = observation('ALIGNED', 1, 'PASS');
    expect(() => new CompareSemanticModelResults().compare([
      {
        model: { modelId: 'model-a', modelVersion: '1' },
        results: [duplicate, { ...duplicate, outcome: 'FAIL' }],
      },
      {
        model: { modelId: 'model-b', modelVersion: '1' },
        results: [duplicate],
      },
    ])).toThrow('Duplicate semantic evaluation result');
  });
});
