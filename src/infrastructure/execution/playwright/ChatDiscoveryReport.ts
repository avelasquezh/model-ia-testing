export type ChatDiscoveryRole = 'composer' | 'sendButton' | 'response';

export type ChatDiscoveryCandidate = {
  readonly role: ChatDiscoveryRole;
  readonly strategy: string;
  readonly matched: boolean;
  readonly count: number;
  readonly selected: boolean;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly element?: {
    readonly tagName: string;
    readonly role: string | null;
    readonly ariaLabel: string | null;
    readonly placeholder: string | null;
    readonly testId: string | null;
    readonly text: string | null;
  };
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
    readonly evidence?: ChatDiscoveryCandidate['element'];
  }>>;
  readonly error?: string;
};
