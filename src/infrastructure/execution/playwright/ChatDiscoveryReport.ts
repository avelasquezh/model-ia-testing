export type ChatDiscoveryRole = 'launcher' | 'composer' | 'sendButton' | 'response';

export type ChatDiscoveryCandidate = {
  readonly role: ChatDiscoveryRole;
  readonly strategy: string;
  readonly matched: boolean;
  readonly count: number;
  readonly selected: boolean;
  readonly deferred?: boolean;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly element?: {
    readonly tagName: string;
    readonly role: string | null;
    readonly ariaLabel: string | null;
    readonly placeholder: string | null;
    readonly testId: string | null;
    readonly text: string | null;
    readonly frameUrl?: string | null;
  };
};

export type ChatDiscoveryTraversalStep = {
  readonly depth: number;
  readonly strategy: string;
  readonly evidence?: ChatDiscoveryCandidate['element'];
};

export type ChatDiscoveryExecutionError = {
  readonly code: string;
  readonly message: string;
  readonly operation: string;
  readonly turnIndex?: number;
};

export type ChatExecutionVerification = {
  readonly send: 'NOT_ATTEMPTED' | 'ATTEMPTED' | 'CONFIRMED';
  readonly receive: 'NOT_ATTEMPTED' | 'FAILED' | 'CONFIRMED';
  readonly conversation: 'NOT_STARTED' | 'FAILED' | 'VERIFIED';
};

export type ChatDiscoveryReport = {
  readonly schemaVersion: 'chat-discovery-0.1';
  readonly targetUrl: string;
  readonly status: 'DISCOVERED' | 'FAILED';
  readonly discoveredAt: string;
  readonly candidates: readonly ChatDiscoveryCandidate[];
  readonly selected: Partial<Record<ChatDiscoveryRole, {
    readonly strategy: string;
    readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    readonly deferred?: boolean;
    readonly evidence?: ChatDiscoveryCandidate['element'];
  }>>;
  readonly traversalPath?: readonly ChatDiscoveryTraversalStep[];
  readonly execution?: ChatExecutionVerification;
  readonly executionFailureReason?:
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
  readonly executionError?: ChatDiscoveryExecutionError;
  readonly error?: string;
};
