import { HttpSemanticEvaluatorAdapter } from '../src/infrastructure/evaluation/HttpSemanticEvaluatorAdapter.js';
import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
} from '../src/domain/evaluation/SemanticEvaluator.js';
import { EvaluationMethodology } from '../src/domain/evaluation/EvaluationMethodology.js';

const endpoint = process.env.SEMANTIC_EVALUATOR_ENDPOINT?.trim();
const authorization = process.env.SEMANTIC_EVALUATOR_AUTHORIZATION?.trim();

if (!endpoint) {
  throw new Error('SEMANTIC_EVALUATOR_ENDPOINT is required');
}

const input: SemanticEvaluationInput = {
  criterionId: process.env.SEMANTIC_EVALUATOR_CRITERION_ID?.trim() || 'D2-C01',
  criterionVersion: process.env.SEMANTIC_EVALUATOR_CRITERION_VERSION?.trim() || 'candidate-0.1',
  evidenceIds: ['live-evidence-turn-1'],
  userInput: 'Quiero comprar una camisa azul talla M',
  expectedIntent:
    'El sistema debe identificar la intención de compra de una camisa y conservar los atributos explícitos.',
  expectedIntentVersion: 'intent-0.1',
  observedResponse: 'La intención de compra fue identificada y los atributos fueron conservados.',
  allowedContext: [],
  modelId: process.env.SEMANTIC_EVALUATOR_MODEL_ID?.trim() || 'external-provider-under-test',
  modelVersion: process.env.SEMANTIC_EVALUATOR_MODEL_VERSION?.trim() || 'version-under-test',
  promptVersion: process.env.SEMANTIC_EVALUATOR_PROMPT_VERSION?.trim() || 'semantic-prompt-0.1',
  methodVersion: process.env.SEMANTIC_EVALUATOR_METHOD_VERSION?.trim() || 'AI-METHOD-0.1',
};

const mapResponse = (request: SemanticEvaluationInput, payload: unknown): SemanticEvaluationOutput => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Semantic evaluator response must be a JSON object');
  }

  const candidate = payload as Record<string, unknown>;
  const requiredText = [
    'outcome',
    'justification',
    'modelId',
    'modelVersion',
    'promptVersion',
    'methodVersion',
    'criterionId',
    'criterionVersion',
  ];

  for (const field of requiredText) {
    if (typeof candidate[field] !== 'string' || !candidate[field].trim()) {
      throw new Error(`Semantic evaluator response field is required: ${field}`);
    }
  }

  if (typeof candidate.evidenceInsufficient !== 'boolean') {
    throw new Error('Semantic evaluator response field is required: evidenceInsufficient');
  }
  if (!Array.isArray(candidate.evidenceIds) || !candidate.evidenceIds.every((id) => typeof id === 'string')) {
    throw new Error('Semantic evaluator response field is required: evidenceIds');
  }

  EvaluationMethodology.assertValidOutcome(candidate.outcome);

  return {
    outcome: candidate.outcome,
    justification: candidate.justification,
    evidenceInsufficient: candidate.evidenceInsufficient,
    modelId: candidate.modelId,
    modelVersion: candidate.modelVersion,
    promptVersion: candidate.promptVersion,
    methodVersion: candidate.methodVersion,
    criterionId: candidate.criterionId,
    criterionVersion: candidate.criterionVersion,
    evidenceIds: candidate.evidenceIds,
  };
};

const evaluator = new HttpSemanticEvaluatorAdapter({
  endpoint,
  ...(authorization ? { headers: { authorization } } : {}),
  mapResponse,
});

const result = await evaluator.evaluate(input);

if (result.criterionId !== input.criterionId || result.criterionVersion !== input.criterionVersion) {
  throw new Error('Semantic evaluator response does not preserve criterion provenance');
}
if (result.modelId !== input.modelId || result.modelVersion !== input.modelVersion) {
  throw new Error('Semantic evaluator response does not preserve model provenance');
}
if (result.promptVersion !== input.promptVersion || result.methodVersion !== input.methodVersion) {
  throw new Error('Semantic evaluator response does not preserve method provenance');
}
if (result.evidenceIds.join('\u0000') !== input.evidenceIds.join('\u0000')) {
  throw new Error('Semantic evaluator response does not preserve evidence identity');
}

console.log(JSON.stringify({
  outcome: result.outcome,
  evidenceInsufficient: result.evidenceInsufficient,
  criterionId: result.criterionId,
  criterionVersion: result.criterionVersion,
  evidenceIds: result.evidenceIds,
  modelId: result.modelId,
  modelVersion: result.modelVersion,
  promptVersion: result.promptVersion,
  methodVersion: result.methodVersion,
}, null, 2));
