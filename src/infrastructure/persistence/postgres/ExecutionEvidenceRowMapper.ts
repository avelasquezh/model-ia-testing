import type { EffectiveTargetConfiguration } from '../../../domain/target/EffectiveTargetConfiguration.js';
import type { ExecutionObservation } from '../../../domain/execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../../../domain/execution/ExecutionTechnicalError.js';
import { ExecutionEvidence, type ExecutionEvidenceProps } from '../../../domain/evidence/ExecutionEvidence.js';

type PersistedObservation = Omit<ExecutionObservation, 'startedAt' | 'observedAt' | 'screenshot'> & {
  startedAt: string;
  observedAt: string;
  screenshotBase64?: string;
};

type PersistedError = Omit<ExecutionTechnicalError, 'occurredAt'> & {
  occurredAt: string;
};

export type ExecutionEvidenceRow = {
  id: string;
  execution_id: string;
  target_id: string;
  target_url: string;
  target_configuration: EffectiveTargetConfiguration | null;
  scenario_version: number;
  test_system_version: string;
  transcript: unknown;
  errors: unknown;
  captured_at: Date | string;
};

const serializeObservation = (observation: ExecutionObservation): PersistedObservation => ({
  input: observation.input,
  response: observation.response,
  startedAt: observation.startedAt.toISOString(),
  observedAt: observation.observedAt.toISOString(),
  durationMs: observation.durationMs,
  ...(observation.screenshot
    ? { screenshotBase64: Buffer.from(observation.screenshot).toString('base64') }
    : {}),
});

const deserializeObservation = (observation: PersistedObservation): ExecutionObservation => ({
  input: observation.input,
  response: observation.response,
  startedAt: new Date(observation.startedAt),
  observedAt: new Date(observation.observedAt),
  durationMs: observation.durationMs,
  ...(observation.screenshotBase64
    ? { screenshot: new Uint8Array(Buffer.from(observation.screenshotBase64, 'base64')) }
    : {}),
});

const serializeError = (error: ExecutionTechnicalError): PersistedError => ({
  code: error.code,
  message: error.message,
  operation: error.operation,
  occurredAt: error.occurredAt.toISOString(),
  ...(error.turnIndex === undefined ? {} : { turnIndex: error.turnIndex }),
});

const deserializeError = (error: PersistedError): ExecutionTechnicalError => ({
  code: error.code,
  message: error.message,
  operation: error.operation,
  occurredAt: new Date(error.occurredAt),
  ...(error.turnIndex === undefined ? {} : { turnIndex: error.turnIndex }),
});

export const evidenceToRowValues = (evidence: ExecutionEvidence) => [
  evidence.props.id,
  evidence.props.executionId,
  evidence.props.targetId,
  evidence.props.targetUrl,
  evidence.props.targetConfiguration ? JSON.stringify(evidence.props.targetConfiguration) : null,
  evidence.props.scenarioVersion,
  evidence.props.testSystemVersion,
  JSON.stringify(evidence.props.transcript.map(serializeObservation)),
  JSON.stringify(evidence.props.errors.map(serializeError)),
  evidence.props.capturedAt,
] as const;

export const evidenceFromRow = (row: ExecutionEvidenceRow): ExecutionEvidence => {
  const props: ExecutionEvidenceProps = {
    id: row.id,
    executionId: row.execution_id,
    targetId: row.target_id,
    targetUrl: row.target_url,
    scenarioVersion: row.scenario_version,
    testSystemVersion: row.test_system_version,
    transcript: (row.transcript as PersistedObservation[]).map(deserializeObservation),
    errors: (row.errors as PersistedError[]).map(deserializeError),
    capturedAt: row.captured_at instanceof Date ? row.captured_at : new Date(row.captured_at),
    ...(row.target_configuration ? { targetConfiguration: row.target_configuration } : {}),
  };
  return new ExecutionEvidence(props);
};
