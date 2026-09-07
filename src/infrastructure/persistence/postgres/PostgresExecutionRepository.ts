import type { ExecutionRepository } from '../../../application/ports/ExecutionRepository.js';
import type { Execution } from '../../../domain/execution/Execution.js';
import { Execution as ExecutionModel } from '../../../domain/execution/Execution.js';
import { EvaluationPlan } from '../../../domain/evaluation/EvaluationPlan.js';
import { EvaluationVersionContext } from '../../../domain/versioning/EvaluationVersionContext.js';
import type { ExecutionObservation } from '../../../domain/execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../../../domain/execution/ExecutionTechnicalError.js';
import type { PostgresDatabase } from './PostgresDatabase.js';

type ExecutionRow = {
  id: string;
  scenario_id: string;
  scenario_version: number;
  target_id: string;
  target_url: string;
  status: Execution['props']['status'];
  product_version: string;
  evaluation_method_version: string;
  criterion_catalog_version: string;
  decision_rules_version: string;
  evaluator_version: string | null;
  commit_sha: string | null;
  condition_fingerprint: string | null;
  evaluation_plan: unknown;
  started_at: Date | null;
  finished_at: Date | null;
  observations: unknown;
  errors: unknown;
};

function serializeObservation(observation: ExecutionObservation) {
  return {
    ...observation,
    startedAt: observation.startedAt.toISOString(),
    observedAt: observation.observedAt.toISOString(),
    ...(observation.screenshot !== undefined
      ? { screenshot: Buffer.from(observation.screenshot).toString('base64') }
      : {}),
  };
}

function deserializeObservation(observation: Record<string, unknown>): ExecutionObservation {
  return {
    input: String(observation.input),
    response: String(observation.response),
    startedAt: new Date(String(observation.startedAt)),
    observedAt: new Date(String(observation.observedAt)),
    durationMs: Number(observation.durationMs),
    ...(observation.screenshot !== undefined
      ? { screenshot: Uint8Array.from(Buffer.from(String(observation.screenshot), 'base64')) }
      : {}),
  };
}

function serializeError(error: ExecutionTechnicalError) {
  return { ...error, occurredAt: error.occurredAt.toISOString() };
}

function deserializeError(error: Record<string, unknown>): ExecutionTechnicalError {
  return {
    code: String(error.code),
    message: String(error.message),
    operation: error.operation as ExecutionTechnicalError['operation'],
    ...(error.turnIndex !== undefined ? { turnIndex: Number(error.turnIndex) } : {}),
    occurredAt: new Date(String(error.occurredAt)),
  };
}

export class PostgresExecutionRepository implements ExecutionRepository {
  public constructor(private readonly database: PostgresDatabase) {}

  public async save(execution: Execution): Promise<void> {
    const { props } = execution;
    await this.database.query(
      `
        INSERT INTO executions (
          id, scenario_id, scenario_version, target_id, target_url, status,
          product_version, evaluation_method_version, criterion_catalog_version,
          decision_rules_version, evaluator_version, commit_sha, condition_fingerprint,
          evaluation_plan, started_at, finished_at, observations, errors
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          $14::jsonb, $15, $16, $17::jsonb, $18::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          started_at = EXCLUDED.started_at,
          finished_at = EXCLUDED.finished_at,
          observations = EXCLUDED.observations,
          errors = EXCLUDED.errors
      `,
      [
        props.id,
        props.scenarioId,
        props.scenarioVersion,
        props.targetId,
        props.targetUrl,
        props.status,
        props.versionContext.props.productVersion,
        props.versionContext.props.evaluationMethodVersion,
        props.versionContext.props.criterionCatalogVersion,
        props.versionContext.props.decisionRulesVersion,
        props.versionContext.props.evaluatorVersion ?? null,
        props.versionContext.props.commitSha ?? null,
        props.conditionFingerprint ?? null,
        props.evaluationPlan ? JSON.stringify(props.evaluationPlan.props) : null,
        props.startedAt ?? null,
        props.finishedAt ?? null,
        JSON.stringify((props.observations ?? []).map(serializeObservation)),
        JSON.stringify((props.errors ?? []).map(serializeError)),
      ],
    );
  }

  public async findById(id: string): Promise<Execution | null> {
    const result = await this.database.query<ExecutionRow>(
      `SELECT id, scenario_id, scenario_version, target_id, target_url, status,
              product_version, evaluation_method_version, criterion_catalog_version,
              decision_rules_version, evaluator_version, commit_sha, condition_fingerprint,
              evaluation_plan, started_at, finished_at, observations, errors
         FROM executions WHERE id = $1`,
      [id],
    );

    const row = result.rows[0];
    if (!row) return null;

    const observations = Array.isArray(row.observations)
      ? row.observations.map((item) => deserializeObservation(item as Record<string, unknown>))
      : [];
    const errors = Array.isArray(row.errors)
      ? row.errors.map((item) => deserializeError(item as Record<string, unknown>))
      : [];

    const versionContext = new EvaluationVersionContext({
      productVersion: row.product_version,
      evaluationMethodVersion: row.evaluation_method_version,
      criterionCatalogVersion: row.criterion_catalog_version,
      decisionRulesVersion: row.decision_rules_version,
      ...(row.evaluator_version !== null ? { evaluatorVersion: row.evaluator_version } : {}),
      ...(row.commit_sha !== null ? { commitSha: row.commit_sha } : {}),
    });

    const evaluationPlan = row.evaluation_plan && typeof row.evaluation_plan === 'object'
      ? new EvaluationPlan(row.evaluation_plan as ConstructorParameters<typeof EvaluationPlan>[0])
      : undefined;

    return new ExecutionModel({
      id: row.id,
      scenarioId: row.scenario_id,
      scenarioVersion: row.scenario_version,
      targetId: row.target_id,
      targetUrl: row.target_url,
      status: row.status,
      versionContext,
      ...(evaluationPlan ? { evaluationPlan } : {}),
      ...(row.condition_fingerprint !== null ? { conditionFingerprint: row.condition_fingerprint } : {}),
      ...(row.started_at !== null ? { startedAt: row.started_at } : {}),
      ...(row.finished_at !== null ? { finishedAt: row.finished_at } : {}),
      observations,
      errors,
    });
  }
}
