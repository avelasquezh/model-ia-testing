import { TestFinding, type FindingSeverity } from '../../domain/finding/TestFinding.js';
import type { ExecutionEvidenceRepository } from '../ports/ExecutionEvidenceRepository.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { TestFindingRepository } from '../ports/TestFindingRepository.js';

export type RegisterTestFindingInput = {
  readonly executionId: string;
  readonly evidenceId?: string;
  readonly title: string;
  readonly description: string;
  readonly expected?: string;
  readonly observed?: string;
  readonly severity?: FindingSeverity;
  readonly impact?: string;
  readonly risk?: string;
};

export class RegisterTestFinding {
  public constructor(
    private readonly executions: ExecutionRepository,
    private readonly evidence: ExecutionEvidenceRepository,
    private readonly findings: TestFindingRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: RegisterTestFindingInput): Promise<TestFinding> {
    const execution = await this.executions.findById(input.executionId);
    if (!execution) throw new Error('Execution not found');

    if (execution.props.status === 'PENDING' || execution.props.status === 'RUNNING') {
      throw new Error('Finding requires a finished execution');
    }

    const evidence = await this.evidence.findByExecutionId(execution.props.id);
    if (!evidence) throw new Error('Execution evidence not found');

    if (input.evidenceId !== undefined && input.evidenceId !== evidence.props.id) {
      throw new Error('Finding evidence does not belong to execution');
    }

    const finding = new TestFinding({
      id: this.ids.generate(),
      executionId: execution.props.id,
      evidenceId: evidence.props.id,
      scenarioId: execution.props.scenarioId,
      title: input.title,
      description: input.description,
      ...(input.expected !== undefined ? { expected: input.expected } : {}),
      ...(input.observed !== undefined ? { observed: input.observed } : {}),
      ...(input.severity !== undefined ? { severity: input.severity } : {}),
      ...(input.impact !== undefined ? { impact: input.impact } : {}),
      ...(input.risk !== undefined ? { risk: input.risk } : {}),
      createdAt: new Date(),
    });

    await this.findings.save(finding);
    return finding;
  }
}
