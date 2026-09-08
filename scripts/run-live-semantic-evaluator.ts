import { readFile } from 'node:fs/promises';
import { HttpSemanticEvaluatorAdapter } from '../src/infrastructure/evaluation/HttpSemanticEvaluatorAdapter.js';
import type {
  SemanticEvaluationInput,
  SemanticEvaluationOutput,
} from '../src/domain/evaluation/SemanticEvaluator.js';
import { EvaluationMethodology } from '../src/domain/evaluation/EvaluationMethodology.js';
import { parseBotObservationSet } from '../src/application/evaluation/BotObservationSetValidator.js';

const endpoint = process.env.SEMANTIC_EVALUATOR_ENDPOINT?.trim();
const authorization = process.env.SEMANTIC_EVALUATOR_AUTHORIZATION?.trim();
const observationsFile = process.env.BOT_OBSERVATIONS_FILE?.trim();

if (!endpoint) throw new Error('SEMANTIC_EVALUATOR_ENDPOINT is required');
if (!observationsFile) throw new Error('BOT_OBSERVATIONS_FILE is required');

const modelId = process.env.SEMANTIC_EVALUATOR_MODEL_ID?.trim() || 'external-evaluator-under-test';
const modelVersion = process.env.SEMANTIC_EVALUATOR_MODEL_VERSION?.trim() || 'version-under-test';
const promptVersion = process.env.SEMANTIC_EVALUATOR_PROMPT_VERSION?.trim() || 'semantic-prompt-0.1';
const methodVersion = process.env.SEMANTIC_EVALUATOR_METHOD_VERSION?.trim() || 'AI-METHOD-0.1';
const criterionIdOverride = process.env.SEMANTIC_EVALUATOR_CRITERION_ID?.trim();
const criterionVersionOverride = process.env.SEMANTIC_EVALUATOR_CRITERION_VERSION?.trim();

const parseObservationFile = (raw: string) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Bot observation file must contain valid JSON');
  }
  return parseBotObservationSet(parsed);
};

const observationSet = parseObservationFile(await readFile(observationsFile, 'utf8'));
const observations = observationSet.observations;

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

  const requestEvidence = JSON.stringify(request.evidenceIds);
  const responseEvidence = JSON.stringify(candidate.evidenceIds);
  if (requestEvidence !== responseEvidence) {
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
  turn: number;
  conversationId: string;
  outcome: SemanticEvaluationOutput['outcome'];
  evidenceInsufficient: boolean;
  channel?: string;
  transport?: string;
  botId?: string;
  botVersion?: string;
  executionId?: string;
}> = [];

for (const observation of observations) {
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
    modelId,
    modelVersion,
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
    ...(observation.channel ? { channel: observation.channel } : {}),
    ...(observation.transport ? { transport: observation.transport } : {}),
    ...(observation.botId ? { botId: observation.botId } : {}),
    ...(observation.botVersion ? { botVersion: observation.botVersion } : {}),
    ...(observation.executionId ? { executionId: observation.executionId } : {}),
  });
}

const caseIds = [...new Set(observations.map((observation) => observation.caseId))];
const byCase = caseIds.map((caseId) => results.filter((result) => result.caseId === caseId));
const repeatable = byCase.every((caseResults) => {
  const ordered = [...caseResults].sort((a, b) => a.repetition - b.repetition || a.turn - b.turn);
  return new Set(ordered.map((result) => result.outcome)).size === 1;
});

console.log(JSON.stringify({
  status: repeatable ? 'VALIDATED_REPEATABILITY' : 'NON_REPEATABLE_OBSERVATION',
  observationSchemaVersion: observationSet.schemaVersion,
  observationsFile,
  evaluator: {
    modelId,
    modelVersion,
    promptVersion,
    methodVersion,
  },
  cases: results,
}, null, 2));

if (!repeatable) process.exitCode = 2;
