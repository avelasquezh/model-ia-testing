import type { ExecutionStatus } from '../execution/Execution.js';

export const SCENARIO_RESULT_STATUSES = [
  'PASSED',
  'FAILED',
  'PARTIALLY_PASSED',
  'INCONCLUSIVE',
  'NOT_EVALUABLE',
  'ERROR',
  'CANCELLED',
] as const;

export type ScenarioResultStatus = (typeof SCENARIO_RESULT_STATUSES)[number];

export type QualityEvaluationStatus = 'NOT_EVALUATED';

export type ScenarioResultProps = {
  readonly id: string;
  readonly executionId: string;
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly evidenceId: string;
  readonly executionOutcome: ScenarioResultStatus;
  readonly qualityEvaluationStatus: QualityEvaluationStatus;
  readonly cause?: string;
  readonly createdAt: Date;
};

export class ScenarioResult {
  public constructor(public readonly props: ScenarioResultProps) {
    if (!props.id.trim()) throw new Error('Scenario result id is required');
    if (!props.executionId.trim()) throw new Error('Scenario result execution id is required');
    if (!props.scenarioId.trim()) throw new Error('Scenario result scenario id is required');
    if (!Number.isInteger(props.scenarioVersion) || props.scenarioVersion < 1) {
      throw new Error('Scenario result scenario version must be a positive integer');
    }
    if (!props.evidenceId.trim()) throw new Error('Scenario result evidence id is required');
    if (!props.createdAt) throw new Error('Scenario result creation time is required');

    if (
      (props.executionOutcome === 'INCONCLUSIVE' || props.executionOutcome === 'NOT_EVALUABLE') &&
      !props.cause?.trim()
    ) {
      throw new Error('Scenario result cause is required for inconclusive or non-evaluable results');
    }
  }

  public static statusFromExecution(status: ExecutionStatus): ScenarioResultStatus {
    if (status === 'PENDING' || status === 'RUNNING') {
      throw new Error('Scenario result requires a finished execution');
    }
    return status;
  }
}
