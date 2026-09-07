import { describe, expect, it } from 'vitest';
import { BuildMethodologicalJudgment } from './BuildMethodologicalJudgment.js';

describe('BuildMethodologicalJudgment', () => {
  const builder = new BuildMethodologicalJudgment();

  it('does not derive quality acceptance from consistent observation', () => {
    expect(builder.build({ interpretation: 'CONSISTENT_OBSERVED' }).props).toEqual({
      judgment: 'OBSERVED_CONSISTENT',
      basis: expect.stringContaining('consistently observed'),
    });
  });

  it('preserves observed variability without converting it into failure', () => {
    expect(builder.build({ interpretation: 'VARIABLE_OBSERVED' }).props).toEqual({
      judgment: 'OBSERVED_VARIABLE',
      basis: expect.stringContaining('more than one evaluable outcome'),
    });
  });

  it('produces no judgment when conditions are not comparable', () => {
    expect(builder.build({ interpretation: 'NON_COMPARABLE' }).props.judgment).toBe('NO_JUDGMENT');
  });

  it('produces no judgment when no evaluable observation exists', () => {
    expect(builder.build({ interpretation: 'NO_EVALUABLE_OBSERVATION' }).props.judgment).toBe('NO_JUDGMENT');
  });
});
