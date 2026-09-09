export type PublicSutFailureReason =
  | 'CAPTCHA_GATE'
  | 'NAVIGATION_FAILED'
  | 'FRAME_BLOCKED'
  | 'NO_LAUNCHER'
  | 'NO_COMPOSER'
  | 'NO_SEND'
  | 'NO_RESPONSE'
  | 'RESPONSE_TIMEOUT'
  | 'INTERACTION_FAILED'
  | 'EXECUTION_FAILED';

export type PublicSutFailureInput = {
  readonly code?: string;
  readonly message?: string;
  readonly operation?: string;
};

export function classifyPublicSutFailure(input: PublicSutFailureInput): PublicSutFailureReason {
  const value = `${input.code ?? ''} ${input.message ?? ''}`.toLowerCase();
  if (value.includes('captcha')) return 'CAPTCHA_GATE';
  if (value.includes('navigation') || value.includes('net::')) return 'NAVIGATION_FAILED';
  if (value.includes('frame') || value.includes('cross-origin') || value.includes('blocked')) return 'FRAME_BLOCKED';
  if (value.includes('composer')) return 'NO_COMPOSER';
  if (value.includes('launcher')) return 'NO_LAUNCHER';
  if (value.includes('send button') || value.includes('no_send') || (input.operation === 'SEND' && value.includes('send'))) return 'NO_SEND';
  if (value.includes('response was not observed') || value.includes('response timeout') || value.includes('before timeout')) return 'RESPONSE_TIMEOUT';
  if (value.includes('response')) return 'NO_RESPONSE';
  if (input.operation === 'SEND') return 'INTERACTION_FAILED';
  return 'EXECUTION_FAILED';
}
