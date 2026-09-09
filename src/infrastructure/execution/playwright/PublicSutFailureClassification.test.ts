import { describe, expect, it } from 'vitest';
import { classifyPublicSutFailure } from './PublicSutFailureClassification.js';

describe('classifyPublicSutFailure', () => {
  it('classifies captcha gates explicitly', () => {
    expect(classifyPublicSutFailure({ code: 'ChatDiscoveryError', message: 'CAPTCHA access gate detected (main:iframe[title*=captcha])', operation: 'OPEN' })).toBe('CAPTCHA_GATE');
  });

  it('classifies response wait timeouts separately from discovery failures', () => {
    expect(classifyPublicSutFailure({ code: 'Error', message: 'Conversation response was not observed before timeout', operation: 'SEND' })).toBe('RESPONSE_TIMEOUT');
  });

  it('classifies missing composer and response independently', () => {
    expect(classifyPublicSutFailure({ code: 'ChatDiscoveryError', message: 'Chat composer could not be discovered on the public URL', operation: 'OPEN' })).toBe('NO_COMPOSER');
    expect(classifyPublicSutFailure({ code: 'ChatDiscoveryError', message: 'Chat response could not be discovered on the public URL', operation: 'OPEN' })).toBe('NO_RESPONSE');
  });

  it('classifies frame and navigation failures', () => {
    expect(classifyPublicSutFailure({ code: 'Error', message: 'frame blocked by policy', operation: 'OPEN' })).toBe('FRAME_BLOCKED');
    expect(classifyPublicSutFailure({ code: 'Error', message: 'navigation failed with net::ERR_FAILED', operation: 'OPEN' })).toBe('NAVIGATION_FAILED');
  });

  it('falls back to send interaction failure for unknown send errors', () => {
    expect(classifyPublicSutFailure({ code: 'Error', message: 'click failed', operation: 'SEND' })).toBe('INTERACTION_FAILED');
  });
});
