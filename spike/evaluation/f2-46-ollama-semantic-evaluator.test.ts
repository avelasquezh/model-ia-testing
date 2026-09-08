import { describe, expect, it } from 'vitest';
import { OllamaSemanticEvaluator } from '../../src/infrastructure/evaluation/OllamaSemanticEvaluator.js';
import type { SemanticEvaluationInput } from '../../src/domain/evaluation/SemanticEvaluator.js';

const baseInput: SemanticEvaluationInput = {
  criterionId: 'D2-C01',
  criterionVersion: 'candidate-0.1',
  evidenceIds: ['primary-turn-1'],
  userInput: 'Quiero comprar una camisa azul talla M',
  expectedIntent: 'El sistema debe identificar la intención de compra de una camisa y conservar los atributos explícitos.',
  expectedIntentVersion: 'intent-0.1',
  observedResponse: 'Entiendo que quieres comprar una camisa azul talla M.',
  allowedContext: [],
  modelId: process.env.OLLAMA_MODEL ?? 'llama3.2',
  modelVersion: process.env.OLLAMA_MODEL_VERSION ?? 'unknown-unpinned',
  promptVersion: 'semantic-prompt-0.1',
  methodVersion: 'AI-METHOD-0.1',
};

const enabled = process.env.F2_46_LIVE_AI === 'true';
const describeLive = enabled ? describe : describe.skip;

const config = {
  baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434',
  timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? '30000'),
  modelId: baseInput.modelId,
  modelVersion: baseInput.modelVersion,
  promptVersion: baseInput.promptVersion,
  methodVersion: baseInput.methodVersion,
} as const;

describe('F2-46 Ollama semantic evaluator adapter', () => {
  it('keeps provider configuration outside the domain contract', () => {
    const evaluator = new OllamaSemanticEvaluator(config);
    expect(evaluator).toBeDefined();
    expect(config.baseUrl).toContain('11434');
  });
});

describeLive('F2-46 live Ollama validation', () => {
  it('evaluates the aligned controlled case and returns normalized provenance', async () => {
    const evaluator = new OllamaSemanticEvaluator(config);
    const result = await evaluator.evaluate(baseInput);

    expect(['PASS', 'FAIL', 'PARTIAL', 'INCONCLUSIVE', 'NOT_EVALUABLE']).toContain(result.outcome);
    expect(result.justification.length).toBeGreaterThan(0);
    expect(result.evidenceInsufficient).toBe(false);
    expect(result.evidenceIds).toEqual(baseInput.evidenceIds);
    expect(result.modelId).toBe(config.modelId);
    expect(result.modelVersion).toBe(config.modelVersion);
    expect(result.promptVersion).toBe(config.promptVersion);
    expect(result.methodVersion).toBe(config.methodVersion);
    expect(result.criterionId).toBe(baseInput.criterionId);
  });
});
