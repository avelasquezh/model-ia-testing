import type { ExecutionRepository } from '../../../application/ports/ExecutionRepository.js';
import { Execution } from '../../../domain/execution/Execution.js';
import { PostgresDatabase } from './PostgresDatabase.js';
import { executionFromRow, executionToRowValues, type ExecutionRow } from './ExecutionRowMapper.js';

export class PostgresExecutionRepository implements ExecutionRepository {
  public constructor(private readonly database: PostgresDatabase) {}

  public async save(execution: Execution): Promise<void> {
    const values = executionToRowValues(execution);
    await this.database.query(
      `INSERT INTO executions (
        id, scenario_id, scenario_version, target_id, target_url,
        target_configuration, status, started_at, finished_at, observations, errors
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        scenario_id = EXCLUDED.scenario_id,
        scenario_version = EXCLUDED.scenario_version,
        target_id = EXCLUDED.target_id,
        target_url = EXCLUDED.target_url,
        target_configuration = EXCLUDED.target_configuration,
        status = EXCLUDED.status,
        started_at = EXCLUDED.started_at,
        finished_at = EXCLUDED.finished_at,
        observations = EXCLUDED.observations,
        errors = EXCLUDED.errors`,
      values,
    );
  }

  public async findById(id: string): Promise<Execution | null> {
    const result = await this.database.query<ExecutionRow>(
      `SELECT
        id, scenario_id, scenario_version, target_id, target_url,
        target_configuration, status, started_at, finished_at, observations, errors
      FROM executions
      WHERE id = $1`,
      [id],
    );

    const row = result.rows[0];
    return row ? executionFromRow(row) : null;
  }
}
