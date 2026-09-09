import { describe, expect, it } from 'vitest';
import { parseEvaluationRun } from './EvaluationRunValidator.js';

const validCase = {
  caseId: 'CASE-01',
  repetition: 1,
  turn: 1,
  conversationId: 'conversation-01',
  outcome: 'PASS',
  evidenceInsufficient: false,
  evidenceIds: ['evidence-01'],
};

const validRun = {
  status: 'VALIDATED_REPEATABILITY',
  observationSchemaVersion: 'bot-observation-0.1',
  observationsFile: 'examples/bot-observations.example.json',
  evaluator: {
    modelId: 'evaluator-01',
    modelVersion: '1.0',
    promptVersion: 'prompt-1.0',
    methodVersion: 'AI-METHOD-0.1',
  },
  cases: [validCase],
};

describe('EvaluationRunValidator', () => {
  it('accepts a valid normalized evaluation result and preserves evidence identity', () => {
    expect(parseEvaluationRun(validRun)).toEqual(validRun);
  });

  it('rejects an unsupported status', () => {
    expect(() => parseEvaluationRun({ ...validRun, status: 'PASS' })).toThrow('unsupported status');
  });

  it('rejects missing evaluator provenance', () => {
    expect(() => parseEvaluationRun({ ...validRun, evaluator: { ...validRun.evaluator, promptVersion: '' } }))
      .toThrow('promptVersion');
  });

  it('rejects unsupported case outcomes', () => {
    expect(() => parseEvaluationRun({
      ...validRun,
      cases: [{ ...validCase, outcome: 'UNKNOWN' }],
    })).toThrow('unsupported outcome');
  });

  it('rejects invalid case traceability fields', () => {
    expect(() => parseEvaluationRun({
      ...validRun,
      cases: [{ ...validCase, conversationId: ' ' }],
    })).toThrow('conversationId');

    expect(() => parseEvaluationRun({
      ...validRun,
      cases: [{ ...validCase, evidenceInsufficient: 'false' }],
    })).toThrow('evidenceInsufficient');
  });

  it('rejects missing or empty evidence identity', () => {
    expect(() => parseEvaluationRun({
      ...validRun,
      cases: [{ ...validCase, evidenceIds: undefined }],
    })).toThrow('evidenceIds');

    expect(() => parseEvaluationRun({
      ...validRun,
      cases: [{ ...validCase, evidenceIds: [] }],
    })).toThrow('evidenceIds');
  });

  it('rejects empty optional provenance fields when supplied', () => {
    expect(() => parseEvaluationRun({
      ...validRun,
      cases: [{ ...validCase, channel: ' ' }],
    })).toThrow('channel');
  });
});
