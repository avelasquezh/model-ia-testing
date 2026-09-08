import { describe, expect, it, vi } from 'vitest';
import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
} from '../../src/domain/evaluation/SemanticEvaluator.js';
import { HttpSemanticEvaluatorAdapter } from '../../src/infrastructure/evaluation/HttpSemanticEvaluatorAdapter.js';

const input: SemanticEvaluationInput = {
  criterionId: 'D2-C01',
  criterionVersion: 'candidate-0.1',
  evidenceIds: ['evidence-turn-1'],
  userInput: 'Quiero comprar una camisa azul talla M',
  expectedIntent: 'Identificar la intención de compra y conservar los atributos explícitos.',
  expectedIntentVersion: 'intent-0.1',
  observedResponse: 'La intención de compra fue identificada.',
  allowedContext: [],
  modelId: 'provider-under-test',
  modelVersion: 'version-under-test',
  promptVersion: 'semantic-prompt-0.1',
  methodVersion: 'AI-METHOD-0.1',
};

const normalizedOutput: SemanticEvaluationOutput = {
  outcome: 'PASS',
  justification: 'La respuesta satisface la intención esperada.',
  evidenceInsufficient: false,
  modelId: input.modelId,
  modelVersion: input.modelVersion,
  promptVersion: input.promptVersion,
  methodVersion: input.methodVersion,
  criterionId: input.criterionId,
  criterionVersion: input.criterionVersion,
  evidenceIds: input.evidenceIds,
};

describe('F2-45 HTTP semantic evaluator adapter', () => {
  it('posts the normalized request and maps the external response', async () => {
    const transport = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ providerResult: 'accepted' }),
    });
    const mapResponse = vi.fn().mockReturnValue(normalizedOutput);

    const evaluator = new HttpSemanticEvaluatorAdapter({
      endpoint: 'https://evaluator.example.test/evaluate',
      headers: { authorization: 'Bearer test-token' },
      transport,
      mapResponse,
    });

    const result = await evaluator.evaluate(input);

    expect(result).toEqual(normalizedOutput);
    expect(transport).toHaveBeenCalledOnce();
    expect(transport.mock.calls[0][0]).toBe('https://evaluator.example.test/evaluate');
    expect(transport.mock.calls[0][1].method).toBe('POST');
    expect(transport.mock.calls[0][1].headers).toEqual({
      'content-type': 'application/json',
      authorization: 'Bearer test-token',
    });
    expect(JSON.parse(transport.mock.calls[0][1].body)).toEqual(input);
    expect(mapResponse).toHaveBeenCalledWith(input, { providerResult: 'accepted' });
  });

  it('rejects non-successful external responses before normalization', async () => {
    const mapResponse = vi.fn();
    const evaluator = new HttpSemanticEvaluatorAdapter({
      endpoint: 'https://evaluator.example.test/evaluate',
      transport: vi.fn().mockResolvedValue({
        status: 429,
        json: async () => ({ error: 'rate limited' }),
      }),
      mapResponse,
    });

    await expect(evaluator.evaluate(input)).rejects.toThrow(
      'Semantic evaluator request failed with HTTP 429',
    );
    expect(mapResponse).not.toHaveBeenCalled();
  });

  it('does not impose provider-specific types on the domain contract', async () => {
    const evaluator = new HttpSemanticEvaluatorAdapter({
      endpoint: 'https://evaluator.example.test/evaluate',
      transport: vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ arbitraryProviderPayload: { decision: 'pass' } }),
      }),
      mapResponse: (_input, _payload) => normalizedOutput,
    });

    const result = await evaluator.evaluate(input);

    expect(result.outcome).toBe('PASS');
    expect(result.evidenceIds).toEqual(['evidence-turn-1']);
  });
});
