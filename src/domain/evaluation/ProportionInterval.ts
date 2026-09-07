export type ProportionIntervalProps = {
  readonly successes: number;
  readonly trials: number;
  readonly proportion: number;
  readonly lower: number;
  readonly upper: number;
};

export class ProportionInterval {
  public constructor(public readonly props: ProportionIntervalProps) {
    if (!Number.isInteger(props.successes) || props.successes < 0) {
      throw new Error('Successes must be a non-negative integer');
    }
    if (!Number.isInteger(props.trials) || props.trials <= 0) {
      throw new Error('Trials must be a positive integer');
    }
    if (props.successes > props.trials) {
      throw new Error('Successes cannot exceed trials');
    }
    if (props.proportion < 0 || props.proportion > 1) {
      throw new Error('Proportion must be between 0 and 1');
    }
    if (props.lower < 0 || props.upper > 1 || props.lower > props.upper) {
      throw new Error('Interval bounds must be ordered within [0, 1]');
    }
  }

  public static wilson95(successes: number, trials: number, z = 1.96): ProportionInterval {
    if (!Number.isFinite(z) || z <= 0) throw new Error('Z value must be positive and finite');

    const p = successes / trials;
    const z2 = z * z;
    const denominator = 1 + z2 / trials;
    const center = (p + z2 / (2 * trials)) / denominator;
    const margin =
      (z / denominator) *
      Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials);

    return new ProportionInterval({
      successes,
      trials,
      proportion: p,
      lower: Math.max(0, center - margin),
      upper: Math.min(1, center + margin),
    });
  }
}
