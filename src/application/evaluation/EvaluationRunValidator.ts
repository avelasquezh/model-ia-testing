import type { EvaluationOutcome } from '../../domain/evaluation/EvaluationMethodology.js';

export type EvaluationCaseResult = {
  caseId: string;
  repetition: number;
  turn: number;
  conversationId: string;
  outcome: EvaluationOutcome;
  evidenceInsufficient: boolean;
  channel?: string;
  transport?: string;
  botId?: string;
  botVersion?: string;
  executionId?: string;
};

export type EvaluationRun = {
  status: 'VALIDATED_REPEATABILITY' | 'NON_REPEATABLE_OBSERVATION';
  observationSchemaVersion: string;
  observationsFile: string;
  evaluator: {
    modelId: string;
    modelVersion: string;
    promptVersion: string;
    methodVersion: string;
  };
  cases: EvaluationCaseResult[];
};

const SCHEMA_VERSION = 'bot-observation-0.1';
const OUTCOMES = new Set<EvaluationOutcome>(['PASS', 'FAIL', 'PARTIAL', 'INCONCLUSIVE', 'NOT_EVALUABLE']);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

const validateProvenance = (value: unknown): EvaluationRun['evaluator'] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Evaluation result evaluator provenance must be an object');
  }

  const evaluator = value as Record<string, unknown>;
  const modelId = evaluator.modelId;
  const modelVersion = evaluator.modelVersion;
  const promptVersion = evaluator.promptVersion;
  const methodVersion = evaluator.methodVersion;

  if (!isNonEmptyString(modelId)) {
    throw new Error('Evaluation result evaluator requires non-empty field: modelId');
  }
  if (!isNonEmptyString(modelVersion)) {
    throw new Error('Evaluation result evaluator requires non-empty field: modelVersion');
  }
  if (!isNonEmptyString(promptVersion)) {
    throw new Error('Evaluation result evaluator requires non-empty field: promptVersion');
  }
  if (!isNonEmptyString(methodVersion)) {
    throw new Error('Evaluation result evaluator requires non-empty field: methodVersion');
  }

  return { modelId, modelVersion, promptVersion, methodVersion };
};

const validateCaseResult = (value: unknown, index: number): EvaluationCaseResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Evaluation case ${index} must be an object`);
  }

  const result = value as Record<string, unknown>;
  const caseId = result.caseId;
  const conversationId = result.conversationId;
  const repetition = result.repetition;
  const turn = result.turn;
  const outcome = result.outcome;
  const evidenceInsufficient = result.evidenceInsufficient;

  if (!isNonEmptyString(caseId)) {
    throw new Error(`Evaluation case ${index} requires non-empty field: caseId`);
  }
  if (!isNonEmptyString(conversationId)) {
    throw new Error(`Evaluation case ${index} requires non-empty field: conversationId`);
  }
  if (!isPositiveInteger(repetition)) {
    throw new Error(`Evaluation case ${index} requires a positive integer repetition`);
  }
  if (!isPositiveInteger(turn)) {
    throw new Error(`Evaluation case ${index} requires a positive integer turn`);
  }
  if (typeof outcome !== 'string' || !OUTCOMES.has(outcome as EvaluationOutcome)) {
    throw new Error(`Evaluation case ${index} has unsupported outcome`);
  }
  if (typeof evidenceInsufficient !== 'boolean') {
    throw new Error(`Evaluation case ${index} requires boolean evidenceInsufficient`);
  }

  const optionalFields = ['channel', 'transport', 'botId', 'botVersion', 'executionId'] as const;
  for (const field of optionalFields) {
    const fieldValue = result[field];
    if (fieldValue !== undefined && !isNonEmptyString(fieldValue)) {
      throw new Error(`Evaluation case ${index} requires non-empty optional field: ${field}`);
    }
  }

  return {
    caseId,
    repetition,
    turn,
    conversationId,
    outcome: outcome as EvaluationOutcome,
    evidenceInsufficient,
    ...(isNonEmptyString(result.channel) ? { channel: result.channel } : {}),
    ...(isNonEmptyString(result.transport) ? { transport: result.transport } : {}),
    ...(isNonEmptyString(result.botId) ? { botId: result.botId } : {}),
    ...(isNonEmptyString(result.botVersion) ? { botVersion: result.botVersion } : {}),
    ...(isNonEmptyString(result.executionId) ? { executionId: result.executionId } : {}),
  };
};

export const parseEvaluationRun = (raw: unknown): EvaluationRun => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Evaluation result must be a JSON object');
  }

  const run = raw as Record<string, unknown>;
  const status = run.status;
  const observationSchemaVersion = run.observationSchemaVersion;
  const observationsFile = run.observationsFile;

  if (status !== 'VALIDATED_REPEATABILITY' && status !== 'NON_REPEATABLE_OBSERVATION') {
    throw new Error('Evaluation result has unsupported status');
  }
  if (observationSchemaVersion !== SCHEMA_VERSION) {
    throw new Error('Unsupported observation schema version');
  }
  if (!isNonEmptyString(observationsFile)) {
    throw new Error('Evaluation result requires observationsFile');
  }

  const evaluator = validateProvenance(run.evaluator);

  if (!Array.isArray(run.cases) || run.cases.length === 0) {
    throw new Error('Evaluation result must contain cases');
  }
  const cases = run.cases.map(validateCaseResult);

  return {
    status,
    observationSchemaVersion,
    observationsFile,
    evaluator,
    cases,
  };
};
