import type { Scenario } from '../../domain/scenario/Scenario.js';
import type { Target } from '../../domain/target/Target.js';
import type { Execution, ExecutionStatus } from '../../domain/execution/Execution.js';
import type { ExecutionObservation } from '../../domain/execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../../domain/execution/ExecutionTechnicalError.js';

export type ExecutionRunnerInput = {
  readonly execution: Execution;
  readonly scenario: Scenario;
  readonly target: Target;
};

export type ExecutionRunnerOptions = {
  readonly timeoutMs: number;
  readonly signal?: AbortSignal;
};

export type ExecutionRunnerResult = {
  readonly status: Exclude<ExecutionStatus, 'PENDING' | 'RUNNING'>;
  readonly observations?: readonly ExecutionObservation[];
  readonly errors?: readonly ExecutionTechnicalError[];
};

export interface ExecutionRunner {
  execute(
    input: ExecutionRunnerInput,
    options: ExecutionRunnerOptions,
  ): Promise<ExecutionRunnerResult>;
}
