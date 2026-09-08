import { HttpSemanticEvaluatorAdapter } from '../src/infrastructure/evaluation/HttpSemanticEvaluatorAdapter.js';
import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
} from '../src/domain/evaluation/SemanticEvaluator.js';
import { EvaluationMethodology } from '../src/domain/evaluation/EvaluationMethodology.js';

const endpoint = process.env.SEMANTIC_EVALUATOR_ENDPOINT?.trim();
const authorization = process.env.SEMANTIC_EVALUATOR_AUTHORIZATION?.trim();
const repetitions = Number(process.env.SEMANTIC_EVALUATOR_REPETITIONS ?? '3');

if (!endpoint) throw new Error('SEMANTIC_EVALUATOR_ENDPOINT is required');
if (!Number.isInteger(repetitions) || repetitions < 1) {
  throw new Error('SEMANTIC_EVALUATOR_REPETITIONS must be a positive integer');
}

const modelId = process.env.SEMANTIC_EVALUATOR_MODEL_ID?.trim() || 'external-provider-under-test';
const modelVersion = process.env.SEMANTIC_EVALUATOR_MODEL_VERSION?.trim() || 'version-under-test';
const promptVersion = process.env.SEMANTIC_EVALUATOR_PROMPT_VERSION?.trim() || 'semantic-prompt-0.1';
const methodVersion = process.env.SEMANTIC_EVALUATOR_METHOD_VERSION?.trim() || 'AI-METHOD-0.1';
const criterionId = process.env.SEMANTIC_EVALUATOR_CRITERION_ID?.trim() || 'D2-C01';
const criterionVersion = process.env.SEMANTIC_EVALUATOR_CRITERION_VERSION?.trim() || 'candidate-0.1';

const cases: Array<Pick<SemanticEvaluationInput, 'userInput' | 'observedResponse' | 'expectedIntent'>> = [
  {
    userInput: 'Quiero comprar una camisa azul talla M.',
    observedResponse: 'La intención de compra fue identificada y los atributos fueron conservados.',
    expectedIntent:
      'El sistema debe identificar la intención de compra de una camisa y conservar los atributos explícitos.',
  },
  {
    userInput: 'Solo quiero saber qué colores tienen disponibles.',
    observedResponse: 'Tenemos azul, blanco y negro.',
    expectedIntent:
      'El sistema debe identificar la intención de compra de una camisa y conservar los atributos explícitos.',
  },
  {
    userInput: '¿Puedes ayudarme con esto?',
    observedResponse: 'Necesito más información para determinar la intención.',
    expectedIntent:
      'El sistema debe identificar la intención de compra de una camisa y conservar los atributos explícitos.',
  },
];

const mapResponse = (request: SemanticEvaluationInput, payload: unknown): SemanticEvaluationOutput => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Semantic evaluator response must be a JSON object');
  }

  const candidate = payload as Record<string, unknown>;
  for (const field of [
    'outcome',
    'justification',
    'modelId',
    'modelVersion',
    'promptVersion',
    'methodVersion',
    'criterionId',
    'criterionVersion',
  ]) {
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

  if (candidate.criterionId !== request.criterionId || candidate.criterionVersion !== request.criterionVersion) {
    throw new Error('Semantic evaluator response does not preserve criterion provenance');
  }
  if (candidate.modelId !== request.modelId || candidate.modelVersion !== request.modelVersion) {
    throw new Error('Semantic evaluator response does not preserve model provenance');
  }
  if (candidate.promptVersion !== request.promptVersion || candidate.methodVersion !== request.methodVersion) {
    throw new Error('Semantic evaluator response does not preserve method provenance');
  }
  if (candidate.evidenceIds.length !== 1 || candidate.evidenceIds[0] !== request.evidenceIds[0]) {
    throw new Error('Semantic evaluator response does not preserve evidence identity');
  }

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

const results: Array<{
  caseId: string;
  repetition: number;
  outcome: SemanticEvaluationOutput['outcome'];
  evidenceInsufficient: boolean;
}> = [];

for (let repetition = 1; repetition <= repetitions; repetition += 1) {
  for (const [index, testCase] of cases.entries()) {
    const input: SemanticEvaluationInput = {
      ...testCase,
      criterionId,
      criterionVersion,
      evidenceIds: [`live-evidence-${index + 1}`],
      expectedIntentVersion: 'intent-0.1',
      allowedContext: [],
      modelId,
      modelVersion,
      promptVersion,
      methodVersion,
    };

    const result = await evaluator.evaluate(input);
    results.push({
      caseId: `D2-C01-${index + 1}`,
      repetition,
      outcome: result.outcome,
      evidenceInsufficient: result.evidenceInsufficient,
    });
  }
}

const byCase = cases.map((_, index) => results.filter((result) => result.caseId === `D2-C01-${index + 1}`));
const repeatable = byCase.every((caseResults) => new Set(caseResults.map((result) => result.outcome)).size === 1);

console.log(JSON.stringify({
  status: repeatable ? 'VALIDATED_REPEATABILITY' : 'NON_REPEATABLE_OBSERVATION',
  criterionId,
  criterionVersion,
  modelId,
  modelVersion,
  promptVersion,
  methodVersion,
  repetitions,
  cases: results,
}, null, 2));

if (!repeatable) process.exitCode = 2;
