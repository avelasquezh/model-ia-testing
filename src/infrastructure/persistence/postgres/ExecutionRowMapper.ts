import type { EffectiveTargetConfiguration } from '../../../domain/target/EffectiveTargetConfiguration.js';
import type { ExecutionObservation } from '../../../domain/execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../../../domain/execution/ExecutionTechnicalError.js';
import { Execution, type ExecutionProps } from '../../../domain/execution/Execution.js';

type PersistedObservation = Omit<ExecutionObservation, 'startedAt' | 'observedAt' | 'screenshot'> & {
  startedAt: string;
  observedAt: string;
  screenshotBase64?: string;
};

type PersistedError = Omit<ExecutionTechnicalError, 'occurredAt' | 'turnIndex'> & {
  occurredAt: string;
  turnIndex?: number;
};

export type ExecutionRow = {
  id: string;
  scenario_id: string;
  scenario_version: number;
  target_id: string;
  target_url: string;
  target_configuration: EffectiveTargetConfiguration | null;
  status: ExecutionProps['status'];
  started_at: Date | string | null;
  finished_at: Date | string | null;
  observations: unknown;
  errors: unknown;
};

const toDate = (value: Date | string | null): Date | undefined =>
  value === null ? undefined : value instanceof Date ? value : new Date(value);

const serializeObservation = (observation: ExecutionObservation): PersistedObservation => {
  const persisted: PersistedObservation = {
    input: observation.input,
    response: observation.response,
    startedAt: observation.startedAt.toISOString(),
    observedAt: observation.observedAt.toISOString(),
    durationMs: observation.durationMs,
  };
  if (observation.screenshot) {
    persisted.screenshotBase64 = Buffer.from(observation.screenshot).toString('base64');
  }
  return persisted;
};

const deserializeObservation = (observation: PersistedObservation): ExecutionObservation => {
  const base: ExecutionObservation = {
    input: observation.input,
    response: observation.response,
    startedAt: new Date(observation.startedAt),
    observedAt: new Date(observation.observedAt),
    durationMs: observation.durationMs,
  };
  return observation.screenshotBase64
    ? { ...base, screenshot: new Uint8Array(Buffer.from(observation.screenshotBase64, 'base64')) }
    : base;
};

const serializeError = (error: ExecutionTechnicalError): PersistedError => {
  const persisted: PersistedError = {
    code: error.code,
    message: error.message,
    operation: error.operation,
    occurredAt: error.occurredAt.toISOString(),
  };
  if (error.turnIndex !== undefined) persisted.turnIndex = error.turnIndex;
  return persisted;
};

const deserializeError = (error: PersistedError): ExecutionTechnicalError => {
  const base: ExecutionTechnicalError = {
    code: error.code,
    message: error.message,
    operation: error.operation,
    occurredAt: new Date(error.occurredAt),
  };
  return error.turnIndex === undefined ? base : { ...base, turnIndex: error.turnIndex };
};

export const executionToRowValues = (execution: Execution) => [
  execution.props.id,
  execution.props.scenarioId,
  execution.props.scenarioVersion,
  execution.props.targetId,
  execution.props.targetUrl,
  execution.props.targetConfiguration ? JSON.stringify(execution.props.targetConfiguration) : null,
  execution.props.status,
  execution.props.startedAt ?? null,
  execution.props.finishedAt ?? null,
  JSON.stringify((execution.props.observations ?? []).map(serializeObservation)),
  JSON.stringify((execution.props.errors ?? []).map(serializeError)),
] as const;

export const executionFromRow = (row: ExecutionRow): Execution => {
  const observations = (row.observations as PersistedObservation[]).map(deserializeObservation);
  const errors = (row.errors as PersistedError[]).map(deserializeError);
  const startedAt = toDate(row.started_at);
  const finishedAt = toDate(row.finished_at);
  const props: ExecutionProps = {
    id: row.id,
    scenarioId: row.scenario_id,
    scenarioVersion: row.scenario_version,
    targetId: row.target_id,
    targetUrl: row.target_url,
    status: row.status,
    observations,
    errors,
    ...(row.target_configuration ? { targetConfiguration: row.target_configuration } : {}),
    ...(startedAt ? { startedAt } : {}),
    ...(finishedAt ? { finishedAt } : {}),
  };
  return new Execution(props);
};
