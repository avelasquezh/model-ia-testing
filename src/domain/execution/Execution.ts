import type { EffectiveTargetConfiguration } from '../target/EffectiveTargetConfiguration.js';
import type { ExecutionObservation } from './ExecutionObservation.js';
import type { ExecutionTechnicalError } from './ExecutionTechnicalError.js';

export const EXECUTION_STATUSES = [
  'PENDING',
  'RUNNING',
  'PASSED',
  'FAILED',
  'PARTIALLY_PASSED',
  'INCONCLUSIVE',
  'NOT_EVALUABLE',
  'ERROR',
  'CANCELLED',
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export type ExecutionProps = {
  readonly id: string;
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly targetId: string;
  readonly targetUrl: string;
  readonly targetConfiguration?: EffectiveTargetConfiguration;
  readonly status: ExecutionStatus;
  readonly startedAt?: Date;
  readonly finishedAt?: Date;
  readonly observations?: readonly ExecutionObservation[];
  readonly errors?: readonly ExecutionTechnicalError[];
};

export class Execution {
  public constructor(public readonly props: ExecutionProps) {
    if (!props.id.trim()) throw new Error('Execution id is required');
    if (!props.scenarioId.trim()) throw new Error('Execution scenario id is required');
    if (!props.targetId.trim()) throw new Error('Execution target id is required');
    if (!props.targetUrl.trim()) throw new Error('Execution target URL is required');
    if (!Number.isInteger(props.scenarioVersion) || props.scenarioVersion < 1) {
      throw new Error('Execution scenario version must be a positive integer');
    }
    if (props.targetConfiguration) {
      if (props.targetConfiguration.id !== props.targetId) {
        throw new Error('Execution target configuration id must match target id');
      }
      if (props.targetConfiguration.url !== props.targetUrl) {
        throw new Error('Execution target configuration URL must match target URL');
      }
      if (!props.targetConfiguration.name.trim()) {
        throw new Error('Execution target configuration name is required');
      }
    }
  }

  public start(startedAt: Date = new Date()): Execution {
    if (this.props.status !== 'PENDING') {
      throw new Error('Only pending executions can start');
    }
    return new Execution({ ...this.props, status: 'RUNNING', startedAt });
  }

  public finish(
    status: Exclude<ExecutionStatus, 'PENDING' | 'RUNNING'>,
    finishedAt: Date = new Date(),
    observations: readonly ExecutionObservation[] = this.props.observations ?? [],
    errors: readonly ExecutionTechnicalError[] = this.props.errors ?? [],
  ): Execution {
    if (this.props.status !== 'RUNNING') {
      throw new Error('Only running executions can finish');
    }
    if (finishedAt < (this.props.startedAt ?? finishedAt)) {
      throw new Error('Execution finish time cannot precede start time');
    }
    return new Execution({ ...this.props, status, finishedAt, observations, errors });
  }
}
