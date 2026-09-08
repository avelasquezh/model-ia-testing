import { describe, expect, it } from 'vitest';
import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
  SemanticEvaluatorPort,
} from '../../src/domain/evaluation/SemanticEvaluator.js';

const input: SemanticEvaluationInput = {
  criterionId: 'D2-C01',
  criterionVersion: 'candidate-0.1',
  evidenceIds: ['evidence-turn-1'],
  userInput: 'Quiero comprar una camisa azul talla M',
  expectedIntent: 'El sistema debe identificar la intención de compra de una camisa y conservar los atributos explícitos.',
  expectedIntentVersion: 'intent-0.1',
  observedResponse: 'La intención de compra fue identificada y los atributos fueron conservados.',
  allowedContext: [],
  modelId: 'provider-under-test',
  modelVersion: 'version-under-test',
  promptVersion: 'semantic-prompt-0.1',
  methodVersion: 'AI-METHOD-0.1',
};

const output: SemanticEvaluationOutput = {
  outcome: 'PASS',
  justification: 'La respuesta satisface la intención esperada y conserva los atributos explícitos.',
  evidenceInsufficient: false,
  modelId: input.modelId,
  modelVersion: input.modelVersion,
  promptVersion: input.promptVersion,
  methodVersion: input.methodVersion,
  criterionId: input.criterionId,
  criterionVersion: input.criterionVersion,
  evidenceIds: input.evidenceIds,
};

class RecordingSemanticEvaluator implements SemanticEvaluatorPort {
  public readonly received: SemanticEvaluationInput[] = [];

  public async evaluate(request: SemanticEvaluationInput): Promise<SemanticEvaluationOutput> {
    this.received.push(request);
    return output;
  }
}

describe('F2-45 semantic evaluator port', () => {
  it('accepts a provider-neutral semantic evaluation request', async () => {
    const evaluator = new RecordingSemanticEvaluator();
    const result = await evaluator.evaluate(input);

    expect(evaluator.received).toHaveLength(1);
    expect(result.outcome).toBe('PASS');
    expect(result.evidenceIds).toEqual(input.evidenceIds);
  });

  it('keeps primary conversational evidence separate from evaluator output', async () => {
    const evaluator = new RecordingSemanticEvaluator();
    const result = await evaluator.evaluate(input);

    expect(result.justification).not.toContain(input.observedResponse);
    expect(result.evidenceIds).toEqual(['evidence-turn-1']);
  });

  it('requires model and method provenance in the normalized result', async () => {
    const evaluator = new RecordingSemanticEvaluator();
    const result = await evaluator.evaluate(input);

    expect(result.modelId).toBe(input.modelId);
    expect(result.modelVersion).toBe(input.modelVersion);
    expect(result.promptVersion).toBe(input.promptVersion);
    expect(result.methodVersion).toBe(input.methodVersion);
    expect(result.criterionVersion).toBe(input.criterionVersion);
  });

  it('is compatible with asynchronous provider adapters without exposing provider-specific types', async () => {
    const evaluator: SemanticEvaluatorPort = new RecordingSemanticEvaluator();
    const result = await evaluator.evaluate(input);

    expect(result.criterionId).toBe('D2-C01');
    expect(result.evidenceInsufficient).toBe(false);
  });
});
