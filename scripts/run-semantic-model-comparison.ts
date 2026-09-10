import { readFile } from 'node:fs/promises';
import { HttpSemanticEvaluatorAdapter } from '../src/infrastructure/evaluation/HttpSemanticEvaluatorAdapter.js';
import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
} from '../src/domain/evaluation/SemanticEvaluator.js';
import { EvaluationMethodology } from '../src/domain/evaluation/EvaluationMethodology.js';
import { parseBotObservationSet } from '../src/application/evaluation/BotObservationSetValidator.js';
import { CompareSemanticModelResults } from '../src/application/evaluation/CompareSemanticModelResults.js';

 type ModelSpec = {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly endpointEnv: string;
  readonly authorizationEnv?: string;
};

type ModelMatrix = {
  readonly schemaVersion: 'semantic-model-matrix-0.1';
  readonly models: readonly ModelSpec[];
};

const observationsFile = process.env.BOT_OBSERVATIONS_FILE?.trim();
const matrixFile = process.env.SEMANTIC_MODEL_MATRIX_FILE?.trim();
const promptVersion = process.env.SEMANTIC_EVALUATOR_PROMPT_VERSION?.trim() || 'semantic-prompt-0.1';
const methodVersion = process.env.SEMANTIC_EVALUATOR_METHOD_VERSION?.trim() || 'AI-METHOD-0.1';
const criterionIdOverride = process.env.SEMANTIC_EVALUATOR_CRITERION_ID?.trim();
const criterionVersionOverride = process.env.SEMANTIC_EVALUATOR_CRITERION_VERSION?.trim();

if (!observationsFile) throw new Error('BOT_OBSERVATIONS_FILE is required');
if (!matrixFile) throw new Error('SEMANTIC_MODEL_MATRIX_FILE is required');

const parseJsonFile = async (file: string): Promise<unknown> => {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as unknown;
  } catch {
    throw new Error(`Invalid JSON file: ${file}`);
  }
};

const observationSet = parseBotObservationSet(await parseJsonFile(observationsFile));
const matrix = await parseJsonFile(matrixFile) as ModelMatrix;
if (matrix.schemaVersion !== 'semantic-model-matrix-0.1') {
  throw new Error('Unsupported semantic model matrix schemaVersion');
}
if (!Array.isArray(matrix.models) || matrix.models.length < 2) {
  throw new Error('Semantic model matrix requires at least two models');
}

const requiredCaseIds = ['ALIGNED', 'NOT_ALIGNED', 'AMBIGUOUS'] as const;
for (const caseId of requiredCaseIds) {
  const repetitions = new Set(
    observationSet.observations
      .filter((observation) => observation.caseId === caseId)
      .map((observation) => observation.repetition),
  );
  if (repetitions.size < 2) {
    throw new Error(`F2-VAL-05 requires at least two independent repetitions for ${caseId}`);
  }
}

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
    throw new Error('Semantic evaluator response does not preserve evaluator provenance');
  }
  if (candidate.promptVersion !== request.promptVersion || candidate.methodVersion !== request.methodVersion) {
    throw new Error('Semantic evaluator response does not preserve method provenance');
  }
  if (JSON.stringify(candidate.evidenceIds) !== JSON.stringify(request.evidenceIds)) {
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

const modelResults: Array<{
  readonly model: { readonly modelId: string; readonly modelVersion: string };
  readonly results: Array<{
    readonly caseId: string;
    readonly repetition: number;
    readonly turn: number;
    readonly conversationId: string;
    readonly outcome: SemanticEvaluationOutput['outcome'];
    readonly evidenceInsufficient: boolean;
    readonly evidenceIds: readonly string[];
  }>;
}> = [];

for (const model of matrix.models) {
  if (!model.modelId.trim() || !model.modelVersion.trim() || !model.endpointEnv.trim()) {
    throw new Error('Each semantic model entry requires modelId, modelVersion and endpointEnv');
  }
  const endpoint = process.env[model.endpointEnv]?.trim();
  if (!endpoint) throw new Error(`Missing endpoint environment variable: ${model.endpointEnv}`);
  const authorization = model.authorizationEnv ? process.env[model.authorizationEnv]?.trim() : undefined;

  const evaluator = new HttpSemanticEvaluatorAdapter({
    endpoint,
    ...(authorization ? { headers: { authorization } } : {}),
    mapResponse,
  });

  const results: Array<{
    readonly caseId: string;
    readonly repetition: number;
    readonly turn: number;
    readonly conversationId: string;
    readonly outcome: SemanticEvaluationOutput['outcome'];
    readonly evidenceInsufficient: boolean;
    readonly evidenceIds: readonly string[];
  }> = [];

  for (const observation of observationSet.observations) {
    const criterionId = criterionIdOverride || observation.caseId;
    const criterionVersion = criterionVersionOverride || observation.expectedIntentVersion;
    const input: SemanticEvaluationInput = {
      userInput: observation.userInput,
      observedResponse: observation.observedResponse,
      expectedIntent: observation.expectedIntent,
      expectedIntentVersion: observation.expectedIntentVersion,
      allowedContext: [],
      evidenceIds: observation.evidenceIds,
      criterionId,
      criterionVersion,
      modelId: model.modelId,
      modelVersion: model.modelVersion,
      promptVersion,
      methodVersion,
    };

    const result = await evaluator.evaluate(input);
    results.push({
      caseId: observation.caseId,
      repetition: observation.repetition,
      turn: observation.turn,
      conversationId: observation.conversationId,
      outcome: result.outcome,
      evidenceInsufficient: result.evidenceInsufficient,
      evidenceIds: [...result.evidenceIds],
    });
  }

  modelResults.push({
    model: { modelId: model.modelId, modelVersion: model.modelVersion },
    results,
  });
}

const comparison = new CompareSemanticModelResults().compare(modelResults);
console.log(JSON.stringify({
  ...comparison,
  protocol: {
    classification: 'F2-VAL-05-EXT-01',
    requiredCases: requiredCaseIds,
    minimumRepetitionsPerCase: 2,
  },
  observationSchemaVersion: observationSet.schemaVersion,
  observationsFile,
  matrixFile,
  promptVersion,
  methodVersion,
}, null, 2));
