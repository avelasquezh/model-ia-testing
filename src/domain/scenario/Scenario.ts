export type ConversationInput = {
  readonly value: string;
};

export type FinishCondition = {
  readonly description: string;
};

export type ScenarioProps = {
  readonly id: string;
  readonly targetId: string;
  readonly name: string;
  readonly objective: string;
  readonly description: string;
  readonly inputs: readonly ConversationInput[];
  readonly expectedBehavior: string;
  readonly finishConditions: readonly FinishCondition[];
  readonly version: number;
};

export class Scenario {
  public constructor(public readonly props: ScenarioProps) {
    if (!props.id.trim()) throw new Error('Scenario id is required');
    if (!props.targetId.trim()) throw new Error('Scenario target id is required');
    if (!props.name.trim()) throw new Error('Scenario name is required');
    if (!props.objective.trim()) throw new Error('Scenario objective is required');
    if (!props.description.trim()) throw new Error('Scenario description is required');
    if (!props.expectedBehavior.trim()) throw new Error('Scenario expected behavior is required');
    if (props.inputs.length === 0) throw new Error('Scenario must contain at least one input');
    if (props.finishConditions.length === 0) throw new Error('Scenario must contain at least one finish condition');
    if (!Number.isInteger(props.version) || props.version < 1) {
      throw new Error('Scenario version must be a positive integer');
    }
  }

  public nextVersion(changes: Omit<ScenarioProps, 'id' | 'version'>): Scenario {
    return new Scenario({ id: this.props.id, version: this.props.version + 1, ...changes });
  }
}
