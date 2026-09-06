export type TargetStatus = 'ACTIVE' | 'INACTIVE';

export type TargetProps = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly status: TargetStatus;
};

export class Target {
  public constructor(public readonly props: TargetProps) {
    if (!props.id.trim()) throw new Error('Target id is required');
    if (!props.name.trim()) throw new Error('Target name is required');

    try {
      const url = new URL(props.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Target URL must use HTTP or HTTPS');
      }
    } catch {
      throw new Error('Target URL must be valid');
    }
  }

  public activate(): Target {
    return new Target({ ...this.props, status: 'ACTIVE' });
  }

  public deactivate(): Target {
    return new Target({ ...this.props, status: 'INACTIVE' });
  }
}
