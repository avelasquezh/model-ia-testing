import type { ExecutionObservation } from '../../domain/execution/ExecutionObservation.js';
import type { ExecutionTechnicalError } from '../../domain/execution/ExecutionTechnicalError.js';

export type ExecutionEvidenceEvent =
  | {
      readonly type: 'OBSERVATION';
      readonly executionId: string;
      readonly turnIndex: number;
      readonly observation: ExecutionObservation;
    }
  | {
      readonly type: 'ERROR';
      readonly executionId: string;
      readonly error: ExecutionTechnicalError;
    };

export interface ExecutionEvidencePublisher {
  publish(event: ExecutionEvidenceEvent): Promise<void>;
}
