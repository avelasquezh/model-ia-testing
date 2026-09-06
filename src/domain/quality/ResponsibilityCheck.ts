export type ResponsibilityViolation = {
  readonly rule: string;
  readonly message: string;
  readonly component?: string;
};

export type ResponsibilityCheckProps = {
  readonly id: string;
  readonly targetComponent: string;
  readonly externalDependencies: readonly string[];
  readonly violations: readonly ResponsibilityViolation[];
};

export class ResponsibilityCheck {
  public constructor(public readonly props: ResponsibilityCheckProps) {
    if (!props.id.trim()) throw new Error('Quality check id is required');
    if (!props.targetComponent.trim()) throw new Error('Quality check target component is required');
  }

  public get passed(): boolean {
    return this.props.violations.length === 0;
  }
}
