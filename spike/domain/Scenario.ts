export type ScenarioStep = {
  readonly message: string;
  readonly expectedResponse: string;
};

export class Scenario {
  public constructor(
    public readonly id: string,
    public readonly steps: readonly ScenarioStep[],
  ) {
    if (steps.length === 0) {
      throw new Error('Scenario requires at least one step');
    }
  }
}
