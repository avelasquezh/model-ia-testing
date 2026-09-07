import { ScenarioResult } from '../../domain/result/ScenarioResult.js';
import type { ExecutionEvidenceRepository } from '../ports/ExecutionEvidenceRepository.js';
import type { ExecutionRepository } from '../ports/ExecutionRepository.js';
import type { IdGenerator } from '../ports/TargetPorts.js';
import type { ScenarioResultRepository } from '../ports/ScenarioResultRepository.js';

export type ProduceScenarioResultInput = {
  readonly executionId: string;
};

export class ProduceScenarioResult {
  public constructor(
    private readonly executions: ExecutionRepository,
    private readonly evidence: ExecutionEvidenceRepository,
    private readonly results: ScenarioResultRepository,
    private readonly ids: IdGenerator,
  ) {}

  public async execute(input: ProduceScenarioResultInput): Promise<ScenarioResult> {
    const execution = await this.executions.findById(input.executionId);
    if (!execution) throw new Error('Execution not found');

    const executionOutcome = ScenarioResult.statusFromExecution(execution.props.status);

    const evidence = await this.evidence.findByExecutionId(execution.props.id);
    if (!evidence) throw new Error('Execution evidence not found');

    const cause = this.causeFor(executionOutcome, execution.props.errors);

    const result = new ScenarioResult({
      id: this.ids.generate(),
      executionId: execution.props.id,
      scenarioId: execution.props.scenarioId,
      scenarioVersion: execution.props.scenarioVersion,
      evidenceId: evidence.props.id,
      executionOutcome,
      qualityEvaluationStatus: 'NOT_EVALUATED',
      ...(cause ? { cause } : {}),
      createdAt: new Date(),
    });

    await this.results.save(result);
    return result;
  }

  private causeFor(
    status: ReturnType<typeof ScenarioResult.statusFromExecution>,
    errors: readonly { message: string }[] | undefined,
  ): string | undefined {
    if (status === 'INCONCLUSIVE') {
      return 'Quality outcome cannot be determined from baseline observable execution evidence';
    }

    if (status === 'NOT_EVALUABLE') {
      return 'Required evaluation evidence is not sufficient to determine the expected behavior';
    }

    if (status === 'ERROR') {
      return errors?.find((error) => error.message.trim())?.message ?? 'Execution ended with a technical error';
    }

    if (status === 'CANCELLED') {
      return 'Execution was cancelled before completion';
    }

    return undefined;
  }
}
