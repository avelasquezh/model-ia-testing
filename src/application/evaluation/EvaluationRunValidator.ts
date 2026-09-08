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

type RecordValue = Record<string, unknown>;

const asRecord = (value: unknown, message: string): RecordValue => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as RecordValue;
};

const requireNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Evaluation result requires non-empty field: ${field}`);
  }
  return value;
};

const requirePositiveInteger = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Evaluation case requires a positive integer ${field}`);
  }
  return value;
};

const requireOutcome = (value: unknown, index: number): EvaluationOutcome => {
  if (typeof value !== 'string' || !OUTCOMES.has(value as EvaluationOutcome)) {
    throw new Error(`Evaluation case ${index} has unsupported outcome`);
  }
  return value as EvaluationOutcome;
};

const validateProvenance = (value: unknown): EvaluationRun['evaluator'] => {
  const evaluator = asRecord(value, 'Evaluation result evaluator provenance must be an object');

  return {
    modelId: requireNonEmptyString(evaluator.modelId, 'modelId'),
    modelVersion: requireNonEmptyString(evaluator.modelVersion, 'modelVersion'),
    promptVersion: requireNonEmptyString(evaluator.promptVersion, 'promptVersion'),
    methodVersion: requireNonEmptyString(evaluator.methodVersion, 'methodVersion'),
  };
};

const validateCaseResult = (value: unknown, index: number): EvaluationCaseResult => {
  const result = asRecord(value, `Evaluation case ${index} must be an object`);
  const caseId = requireNonEmptyString(result.caseId, `case ${index}.caseId`);
  const conversationId = requireNonEmptyString(result.conversationId, `case ${index}.conversationId`);
  const repetition = requirePositiveInteger(result.repetition, `case ${index}.repetition`);
  const turn = requirePositiveInteger(result.turn, `case ${index}.turn`);
  const outcome = requireOutcome(result.outcome, index);

  if (typeof result.evidenceInsufficient !== 'boolean') {
    throw new Error(`Evaluation case ${index} requires boolean evidenceInsufficient`);
  }
  const evidenceInsufficient = result.evidenceInsufficient;

  const optionalFields = ['channel', 'transport', 'botId', 'botVersion', 'executionId'] as const;
  const optional: Partial<Pick<EvaluationCaseResult, (typeof optionalFields)[number]>> = {};
  for (const field of optionalFields) {
    if (result[field] !== undefined) {
      optional[field] = requireNonEmptyString(result[field], `case ${index}.${field}`);
    }
  }

  return {
    caseId,
    repetition,
    turn,
    conversationId,
    outcome,
    evidenceInsufficient,
    ...optional,
  };
};

export const parseEvaluationRun = (raw: unknown): EvaluationRun => {
  const run = asRecord(raw, 'Evaluation result must be a JSON object');

  if (run.status !== 'VALIDATED_REPEATABILITY' && run.status !== 'NON_REPEATABLE_OBSERVATION') {
    throw new Error('Evaluation result has unsupported status');
  }
  const status: EvaluationRun['status'] = run.status;

  if (run.observationSchemaVersion !== SCHEMA_VERSION) {
    throw new Error('Unsupported observation schema version');
  }
  const observationSchemaVersion = run.observationSchemaVersion;
  if (typeof observationSchemaVersion !== 'string') {
    throw new Error('Unsupported observation schema version');
  }

  const observationsFile = requireNonEmptyString(run.observationsFile, 'observationsFile');
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
