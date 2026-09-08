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
  for (const field of ['modelId', 'modelVersion', 'promptVersion', 'methodVersion']) {
    if (!isNonEmptyString(evaluator[field])) {
      throw new Error(`Evaluation result evaluator requires non-empty field: ${field}`);
    }
  }

  return {
    modelId: evaluator.modelId,
    modelVersion: evaluator.modelVersion,
    promptVersion: evaluator.promptVersion,
    methodVersion: evaluator.methodVersion,
  };
};

const validateCaseResult = (value: unknown, index: number): EvaluationCaseResult => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Evaluation case ${index} must be an object`);
  }

  const result = value as Record<string, unknown>;
  for (const field of ['caseId', 'conversationId']) {
    if (!isNonEmptyString(result[field])) {
      throw new Error(`Evaluation case ${index} requires non-empty field: ${field}`);
    }
  }

  for (const field of ['repetition', 'turn']) {
    if (!isPositiveInteger(result[field])) {
      throw new Error(`Evaluation case ${index} requires a positive integer ${field}`);
    }
  }

  if (typeof result.outcome !== 'string' || !OUTCOMES.has(result.outcome as EvaluationOutcome)) {
    throw new Error(`Evaluation case ${index} has unsupported outcome`);
  }

  if (typeof result.evidenceInsufficient !== 'boolean') {
    throw new Error(`Evaluation case ${index} requires boolean evidenceInsufficient`);
  }

  for (const field of ['channel', 'transport', 'botId', 'botVersion', 'executionId']) {
    if (result[field] !== undefined && !isNonEmptyString(result[field])) {
      throw new Error(`Evaluation case ${index} requires non-empty optional field: ${field}`);
    }
  }

  return {
    caseId: result.caseId,
    repetition: result.repetition,
    turn: result.turn,
    conversationId: result.conversationId,
    outcome: result.outcome as EvaluationOutcome,
    evidenceInsufficient: result.evidenceInsufficient,
    ...(result.channel !== undefined ? { channel: result.channel } : {}),
    ...(result.transport !== undefined ? { transport: result.transport } : {}),
    ...(result.botId !== undefined ? { botId: result.botId } : {}),
    ...(result.botVersion !== undefined ? { botVersion: result.botVersion } : {}),
    ...(result.executionId !== undefined ? { executionId: result.executionId } : {}),
  };
};

export const parseEvaluationRun = (raw: unknown): EvaluationRun => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Evaluation result must be a JSON object');
  }

  const run = raw as Record<string, unknown>;
  if (run.status !== 'VALIDATED_REPEATABILITY' && run.status !== 'NON_REPEATABLE_OBSERVATION') {
    throw new Error('Evaluation result has unsupported status');
  }
  if (run.observationSchemaVersion !== SCHEMA_VERSION) {
    throw new Error('Unsupported observation schema version');
  }
  if (!isNonEmptyString(run.observationsFile)) {
    throw new Error('Evaluation result requires observationsFile');
  }
  const evaluator = validateProvenance(run.evaluator);

  if (!Array.isArray(run.cases) || run.cases.length === 0) {
    throw new Error('Evaluation result must contain cases');
  }
  const cases = run.cases.map(validateCaseResult);

  return {
    status: run.status,
    observationSchemaVersion: run.observationSchemaVersion,
    observationsFile: run.observationsFile,
    evaluator,
    cases,
  };
};
