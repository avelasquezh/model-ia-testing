import { describe, expect, it } from 'vitest';
import { ResponseMatchesExpected } from './ResponseMatchesExpected.js';

describe('ResponseMatchesExpected', () => {
  it('passes when observed response matches expected response', () => {
    expect(
      ResponseMatchesExpected.evaluate({
        expected: 'The order was created',
        observed: 'The order was created',
      }),
    ).toBe(true);
  });

  it('ignores surrounding whitespace', () => {
    expect(
      ResponseMatchesExpected.evaluate({
        expected: 'The order was created',
        observed: '  The order was created  ',
      }),
    ).toBe(true);
  });

  it('fails when observed response differs', () => {
    expect(
      ResponseMatchesExpected.evaluate({
        expected: 'The order was created',
        observed: 'The order could not be created',
      }),
    ).toBe(false);
  });
});
