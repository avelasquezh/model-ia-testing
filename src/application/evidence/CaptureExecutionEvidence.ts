import { ExecutionEvidence } from '../../domain/evidence/ExecutionEvidence.js';
import type { ExecutionEvidenceRepository } from '../ports/ExecutionEvidenceRepository.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';

export type CaptureExecutionEvidenceInput = {
  readonly executionId: string;
  readonly testSystemVersion: string;
};

export class CaptureExecutionEvidence {
  public constructor(
    private readonly executions: ExecutionRepository,
    private readonly evidence: ExecutionEvidenceRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: CaptureExecutionEvidenceInput): Promise<ExecutionEvidence> {
    const execution = await this.executions.findById(input.executionId);
    if (!execution) throw new Error('Execution not found');
    if (execution.props.status === 'PENDING' || execution.props.status === 'RUNNING') {
      throw new Error('Execution must be finished before evidence is captured');
    }

    const captured = new ExecutionEvidence({
      id: this.ids.generate(),
      executionId: execution.props.id,
      targetId: execution.props.targetId,
      targetUrl: execution.props.targetUrl,
      scenarioVersion: execution.props.scenarioVersion,
      testSystemVersion: input.testSystemVersion,
      transcript: execution.props.observations ?? [],
      errors: execution.props.errors ?? [],
      capturedAt: new Date(),
      ...(execution.props.targetConfiguration
        ? { targetConfiguration: execution.props.targetConfiguration }
        : {}),
    });

    await this.evidence.save(captured);
    return captured;
  }
}
