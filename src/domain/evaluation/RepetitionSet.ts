import type { Execution } from '../execution/Execution.js';

export type RepetitionSetProps = {
  readonly executions: readonly Execution[];
};

export type RepetitionOutcome = Exclude<Execution['props']['status'], 'PENDING' | 'RUNNING'>;

export type RepetitionOutcomeDistribution = Record<RepetitionOutcome, number>;

const TERMINAL_OUTCOMES: readonly RepetitionOutcome[] = [
  'PASSED',
  'FAILED',
  'PARTIALLY_PASSED',
  'INCONCLUSIVE',
  'NOT_EVALUABLE',
  'ERROR',
  'CANCELLED',
];

export class RepetitionSet {
  public constructor(public readonly props: RepetitionSetProps) {
    if (props.executions.length === 0) throw new Error('Repetition set must contain at least one execution');

    const ids = new Set<string>();
    const first = props.executions[0];
    if (!first) throw new Error('Repetition set must contain at least one execution');

    for (const execution of props.executions) {
      if (ids.has(execution.props.id)) {
        throw new Error(`Duplicate execution in repetition set: ${execution.props.id}`);
      }
      ids.add(execution.props.id);

      if (execution.props.status === 'PENDING' || execution.props.status === 'RUNNING') {
        throw new Error(`Repetition requires a terminal execution status: ${execution.props.id}`);
      }

      if (execution.props.scenarioId !== first.props.scenarioId) {
        throw new Error('Repetition set executions must reference the same scenario');
      }
      if (execution.props.scenarioVersion !== first.props.scenarioVersion) {
        throw new Error('Repetition set executions must reference the same scenario version');
      }
    }
  }

  public get scenarioId(): string {
    return this.props.executions[0]!.props.scenarioId;
  }

  public get scenarioVersion(): number {
    return this.props.executions[0]!.props.scenarioVersion;
  }

  public get hasComparableConditions(): boolean {
    const fingerprints = new Set(this.props.executions.map((execution) => execution.props.conditionFingerprint));
    return fingerprints.size === 1 && !fingerprints.has(undefined);
  }

  public get outcomeDistribution(): RepetitionOutcomeDistribution {
    return TERMINAL_OUTCOMES.reduce<RepetitionOutcomeDistribution>((distribution, outcome) => {
      distribution[outcome] = this.props.executions.filter(
        (execution) => execution.props.status === outcome,
      ).length;
      return distribution;
    }, {
      PASSED: 0,
      FAILED: 0,
      PARTIALLY_PASSED: 0,
      INCONCLUSIVE: 0,
      NOT_EVALUABLE: 0,
      ERROR: 0,
      CANCELLED: 0,
    });
  }
}
