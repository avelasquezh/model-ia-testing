import { describe, expect, it } from 'vitest';

type AiEvaluationRecord = {
  readonly evaluatorId: string;
  readonly evaluatorVersion: string;
  readonly methodVersion: string;
  readonly inputEvidenceIds: readonly string[];
  readonly output: 'PASS' | 'FAIL' | 'PARTIAL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE';
  readonly acceptanceRule: string;
  readonly aiAssisted: boolean;
};

type EvidenceRecord = {
  readonly id: string;
  readonly type: 'PRIMARY' | 'AI_ANALYSIS';
};

const isTraceableAiEvaluation = (evaluation: AiEvaluationRecord): boolean =>
  evaluation.evaluatorId.trim().length > 0 &&
  evaluation.evaluatorVersion.trim().length > 0 &&
  evaluation.methodVersion.trim().length > 0 &&
  evaluation.inputEvidenceIds.length > 0 &&
  evaluation.inputEvidenceIds.every((id) => id.trim().length > 0) &&
  evaluation.acceptanceRule.trim().length > 0 &&
  evaluation.aiAssisted;

const hasPrimaryEvidence = (
  evaluation: AiEvaluationRecord,
  evidence: readonly EvidenceRecord[],
): boolean =>
  evaluation.inputEvidenceIds.some((id) =>
    evidence.some((item) => item.id === id && item.type === 'PRIMARY'),
  );

describe('F2 AI-assisted criteria methodological validation', () => {
  const baseEvaluation: AiEvaluationRecord = {
    evaluatorId: 'evaluator-model-1',
    evaluatorVersion: '1.0.0',
    methodVersion: 'AI-METHOD-0.1',
    inputEvidenceIds: ['evidence-transcript-1'],
    output: 'PASS',
    acceptanceRule: 'PASS when the response satisfies the criterion rule',
    aiAssisted: true,
  };

  const primaryEvidence: EvidenceRecord[] = [
    { id: 'evidence-transcript-1', type: 'PRIMARY' },
  ];

  it('requires evaluator identity, version and evaluation method version', () => {
    expect(isTraceableAiEvaluation(baseEvaluation)).toBe(true);

    expect(
      isTraceableAiEvaluation({ ...baseEvaluation, evaluatorVersion: '' }),
    ).toBe(false);
    expect(isTraceableAiEvaluation({ ...baseEvaluation, methodVersion: '' })).toBe(false);
  });

  it('requires references to the evidence used by the AI evaluation', () => {
    expect(isTraceableAiEvaluation(baseEvaluation)).toBe(true);
    expect(
      isTraceableAiEvaluation({ ...baseEvaluation, inputEvidenceIds: [] }),
    ).toBe(false);
  });

  it('requires an explicit acceptance rule for the AI output', () => {
    expect(isTraceableAiEvaluation(baseEvaluation)).toBe(true);
    expect(
      isTraceableAiEvaluation({ ...baseEvaluation, acceptanceRule: '' }),
    ).toBe(false);
  });

  it('does not allow AI analysis to become the only evidence source', () => {
    const aiOnlyEvidence: EvidenceRecord[] = [
      { id: 'ai-analysis-1', type: 'AI_ANALYSIS' },
    ];
    const evaluation = {
      ...baseEvaluation,
      inputEvidenceIds: ['ai-analysis-1'],
    };

    expect(hasPrimaryEvidence(evaluation, aiOnlyEvidence)).toBe(false);
    expect(hasPrimaryEvidence(evaluation, primaryEvidence)).toBe(true);
  });

  it('keeps the AI output separate from the evidence and marks AI assistance explicitly', () => {
    expect(baseEvaluation.output).toBe('PASS');
    expect(baseEvaluation.aiAssisted).toBe(true);
    expect(primaryEvidence[0]?.type).toBe('PRIMARY');
  });

  it('preserves auditability when the AI evaluation produces an indeterminate result', () => {
    const inconclusive = { ...baseEvaluation, output: 'INCONCLUSIVE' as const };

    expect(isTraceableAiEvaluation(inconclusive)).toBe(true);
    expect(inconclusive.inputEvidenceIds).toContain('evidence-transcript-1');
  });
});
