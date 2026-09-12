export type DiscoveryStrategy =
  | 'SEMANTIC'
  | 'STRUCTURAL'
  | 'GEOMETRIC'
  | 'ACCESSIBILITY'
  | 'BEHAVIORAL'
  | 'DOM_MUTATION';

export type DiscoveryCandidate = {
  readonly id: string;
  readonly tagName: string;
  readonly role?: string;
  readonly ariaLabel?: string;
  readonly text?: string;
  readonly placeholder?: string;
  readonly href?: string;
  readonly title?: string;
  readonly name?: string;
  readonly testId?: string;
  readonly ariaControls?: string;
  readonly ariaExpanded?: string;
  readonly navigationSignal?: boolean;
  readonly readonly?: boolean;
  readonly disabled?: boolean;
  readonly fixed?: boolean;
  readonly bottomDistance?: number;
  readonly rightDistance?: number;
};

export type DiscoveryEvidence = {
  readonly strategy: DiscoveryStrategy;
  readonly signal: string;
  readonly weight: number;
};

export type AdaptiveCandidateScore = {
  readonly candidateId: string;
  readonly score: number;
  readonly evidence: readonly DiscoveryEvidence[];
};

const CHAT_TERMS = /chat|help|assistant|support|message|mensaje|ayuda|asistente|contact|contacto|customer service|live chat/i;
const NEGATIVE_TERMS = /delete|logout|sign.?out|purchase|buy|checkout|share|copy|download/i;

/**
 * Provider-neutral scoring primitives. This deliberately does not replace the
 * existing discovery heuristics; it provides a parallel evidence channel that
 * can be measured against them before becoming authoritative.
 */
export function scoreDiscoveryCandidate(candidate: DiscoveryCandidate): AdaptiveCandidateScore {
  const evidence: DiscoveryEvidence[] = [];

  if (candidate.role === 'button') {
    evidence.push({ strategy: 'STRUCTURAL', signal: 'button-role', weight: 5 });
  }

  if (candidate.tagName === 'a' && candidate.href) {
    evidence.push({ strategy: 'STRUCTURAL', signal: 'anchor-navigation', weight: 3 });
  }

  if (candidate.ariaControls) {
    evidence.push({ strategy: 'ACCESSIBILITY', signal: 'aria-controls', weight: 8 });
  }

  if (candidate.ariaExpanded !== undefined) {
    evidence.push({ strategy: 'BEHAVIORAL', signal: 'aria-expanded', weight: 8 });
  }

  if (candidate.navigationSignal) {
    evidence.push({ strategy: 'BEHAVIORAL', signal: 'navigation-event-handler', weight: 5 });
  }

  const semanticFields = [candidate.ariaLabel, candidate.text, candidate.placeholder, candidate.href, candidate.title, candidate.name, candidate.testId]
    .filter(Boolean) as string[];
  const semanticText = semanticFields.join(' ');
  if (CHAT_TERMS.test(semanticText)) {
    evidence.push({ strategy: 'SEMANTIC', signal: 'chat-language', weight: 20 });

    const metadataText = [candidate.title, candidate.name, candidate.testId].filter(Boolean).join(' ');
    if (metadataText && CHAT_TERMS.test(metadataText)) {
      evidence.push({ strategy: 'SEMANTIC', signal: 'metadata-chat-language', weight: 3 });
    }
  }
  if (NEGATIVE_TERMS.test(semanticText)) {
    evidence.push({ strategy: 'SEMANTIC', signal: 'non-chat-language', weight: -20 });
  }

  if (candidate.fixed) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'fixed-position', weight: 10 });
  }
  if (candidate.fixed && candidate.bottomDistance !== undefined && candidate.bottomDistance < 120) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'near-bottom', weight: 10 });
  }
  if (candidate.fixed && candidate.rightDistance !== undefined && candidate.rightDistance < 120) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'near-right-edge', weight: 10 });
  }

  if (candidate.disabled) {
    evidence.push({ strategy: 'ACCESSIBILITY', signal: 'disabled', weight: -25 });
  }

  if (candidate.readonly) {
    evidence.push({ strategy: 'BEHAVIORAL', signal: 'readonly', weight: -35 });
  }

  return {
    candidateId: candidate.id,
    score: evidence.reduce((total, item) => total + item.weight, 0),
    evidence,
  };
}
