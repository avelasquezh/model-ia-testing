import type { ExecutionEvidenceRepository } from '../../../application/ports/ExecutionEvidenceRepository.js';
import { ExecutionEvidence } from '../../../domain/evidence/ExecutionEvidence.js';
import { PostgresDatabase } from './PostgresDatabase.js';
import {
  evidenceFromRow,
  evidenceToRowValues,
  type ExecutionEvidenceRow,
} from './ExecutionEvidenceRowMapper.js';

export class PostgresExecutionEvidenceRepository implements ExecutionEvidenceRepository {
  public constructor(private readonly database: PostgresDatabase) {}

  public async save(evidence: ExecutionEvidence): Promise<void> {
    const values = evidenceToRowValues(evidence);
    await this.database.query(
      `INSERT INTO execution_evidence (
        id, execution_id, target_id, target_url, target_configuration,
        scenario_version, test_system_version, transcript, errors, captured_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9::jsonb, $10)
      ON CONFLICT (execution_id) DO UPDATE SET
        id = EXCLUDED.id,
        target_id = EXCLUDED.target_id,
        target_url = EXCLUDED.target_url,
        target_configuration = EXCLUDED.target_configuration,
        scenario_version = EXCLUDED.scenario_version,
        test_system_version = EXCLUDED.test_system_version,
        transcript = EXCLUDED.transcript,
        errors = EXCLUDED.errors,
        captured_at = EXCLUDED.captured_at`,
      values,
    );
  }

  public async findByExecutionId(executionId: string): Promise<ExecutionEvidence | undefined> {
    const result = await this.database.query<ExecutionEvidenceRow>(
      `SELECT
        id, execution_id, target_id, target_url, target_configuration,
        scenario_version, test_system_version, transcript, errors, captured_at
      FROM execution_evidence
      WHERE execution_id = $1`,
      [executionId],
    );

    const row = result.rows[0];
    return row ? evidenceFromRow(row) : undefined;
  }
}
