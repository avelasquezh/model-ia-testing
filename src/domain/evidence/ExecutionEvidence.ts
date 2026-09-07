import type { EffectiveTargetConfiguration } from '../target/EffectiveTargetConfiguration.js';
import type { ExecutionObservation } from '../execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../execution/ExecutionTechnicalError.js';

export type ExecutionEvidenceProps = {
  readonly id: string;
  readonly executionId: string;
  readonly targetId: string;
  readonly targetUrl: string;
  readonly targetConfiguration?: EffectiveTargetConfiguration;
  readonly scenarioVersion: number;
  readonly testSystemVersion: string;
  readonly transcript: readonly ExecutionObservation[];
  readonly errors: readonly ExecutionTechnicalError[];
  readonly capturedAt: Date;
};

export class ExecutionEvidence {
  public constructor(public readonly props: ExecutionEvidenceProps) {
    if (!props.id.trim()) throw new Error('Evidence id is required');
    if (!props.executionId.trim()) throw new Error('Evidence execution id is required');
    if (!props.targetId.trim()) throw new Error('Evidence target id is required');
    if (!props.targetUrl.trim()) throw new Error('Evidence target URL is required');
    if (!Number.isInteger(props.scenarioVersion) || props.scenarioVersion < 1) {
      throw new Error('Evidence scenario version must be a positive integer');
    }
    if (!props.testSystemVersion.trim()) throw new Error('Evidence test system version is required');
  }
}
