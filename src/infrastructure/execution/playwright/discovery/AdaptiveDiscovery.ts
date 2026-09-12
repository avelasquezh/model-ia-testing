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
  readonly ariaHasPopup?: string;
  readonly ariaLive?: string;
  readonly dataChatSignal?: string;
  readonly navigationSignal?: boolean;
  readonly shadowHost?: boolean;
  readonly readonly?: boolean;
  readonly disabled?: boolean;
  readonly fixed?: boolean;
  readonly bottomDistance?: number;
  readonly rightDistance?: number;
  readonly width?: number;
  readonly height?: number;
  readonly zIndex?: number;
};

export type DiscoveryEvidence = {
  readonly strategy: DiscoveryStrategy;
  readonly signal: string;
  readonly weight: number;
};

export type AdaptiveCandidateScore = {
  readonly candidateId: string;
  readonly score: number;
  readonly relevanceScore: number;
  readonly interactionScore: number;
  readonly confidenceScore: number;
  readonly evidence: readonly DiscoveryEvidence[];
};

const CHAT_TERMS = /chat|help|assistant|support|message|mensaje|ayuda|asistente|contact|contacto|customer service|live chat|livechat|chatbox|chat widget|widget|conversation|conversacion|conversación|servicio al cliente/i;
const NEGATIVE_TERMS = /delete|remove|logout|log out|sign out|purchase|buy|checkout|share|copy|download|account|profile|menu|language|cookie|privacy|terms|subscribe|unsubscribe|cancel|confirm|submit order|eliminar|borrar|cerrar sesión|comprar|pagar|suscribir|cancelar/i;
const CHAT_ATTRIBUTE_TERMS = /chat|livechat|chatbox|messenger|assistant|support|help|contact|customer|servicio|ayuda|asistente/i;

/**
 * Provider-neutral scoring primitives. Adaptive now keeps several independent
 * evidence dimensions so ranking can be made more exploratory without hiding
 * the reason why a candidate was preferred.
 */
export function scoreDiscoveryCandidate(candidate: DiscoveryCandidate): AdaptiveCandidateScore {
  const evidence: DiscoveryEvidence[] = [];

  if (candidate.role === 'button') {
    evidence.push({ strategy: 'STRUCTURAL', signal: 'button-role', weight: 5 });
  }
  if (candidate.tagName === 'a' && candidate.href) {
    evidence.push({ strategy: 'STRUCTURAL', signal: 'anchor-navigation', weight: 3 });
  }
  if (candidate.ariaHasPopup) {
    evidence.push({ strategy: 'ACCESSIBILITY', signal: 'aria-haspopup', weight: 7 });
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
  if (candidate.shadowHost) {
    evidence.push({ strategy: 'STRUCTURAL', signal: 'open-shadow-host', weight: 6 });
  }

  const semanticFields = [
    candidate.ariaLabel,
    candidate.text,
    candidate.placeholder,
    candidate.href,
    candidate.title,
    candidate.name,
    candidate.testId,
    candidate.dataChatSignal,
  ].filter(Boolean) as string[];
  const semanticText = semanticFields.join(' ');
  if (CHAT_TERMS.test(semanticText)) {
    evidence.push({ strategy: 'SEMANTIC', signal: 'chat-language', weight: 20 });
    const metadataText = [candidate.title, candidate.name, candidate.testId, candidate.dataChatSignal].filter(Boolean).join(' ');
    if (metadataText && CHAT_TERMS.test(metadataText)) {
      evidence.push({ strategy: 'SEMANTIC', signal: 'metadata-chat-language', weight: 5 });
    }
  }
  if (candidate.dataChatSignal && CHAT_ATTRIBUTE_TERMS.test(candidate.dataChatSignal)) {
    evidence.push({ strategy: 'SEMANTIC', signal: 'chat-data-attribute', weight: 12 });
  }
  if (candidate.ariaLive) {
    evidence.push({ strategy: 'ACCESSIBILITY', signal: 'aria-live', weight: 5 });
  }
  if (NEGATIVE_TERMS.test(semanticText)) {
    evidence.push({ strategy: 'SEMANTIC', signal: 'non-chat-language', weight: -20 });
  }

  if (candidate.fixed) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'fixed-position', weight: 10 });
  }
  if (candidate.fixed && candidate.bottomDistance !== undefined && candidate.bottomDistance < 160) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'near-bottom', weight: 10 });
  }
  if (candidate.fixed && candidate.rightDistance !== undefined && candidate.rightDistance < 160) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'near-right-edge', weight: 10 });
  }
  if (candidate.width !== undefined && candidate.height !== undefined && candidate.width > 24 && candidate.height > 24 && candidate.width < 420 && candidate.height < 420) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'widget-like-size', weight: 4 });
  }
  if (candidate.zIndex !== undefined && candidate.zIndex >= 10) {
    evidence.push({ strategy: 'GEOMETRIC', signal: 'elevated-z-index', weight: 3 });
  }

  if (candidate.disabled) {
    evidence.push({ strategy: 'ACCESSIBILITY', signal: 'disabled', weight: -25 });
  }
  if (candidate.readonly) {
    evidence.push({ strategy: 'BEHAVIORAL', signal: 'readonly', weight: -35 });
  }

  const score = evidence.reduce((total, item) => total + item.weight, 0);
  const relevanceScore = evidence
    .filter((item) => item.weight > 0 && ['SEMANTIC', 'STRUCTURAL', 'GEOMETRIC'].includes(item.strategy))
    .reduce((total, item) => total + item.weight, 0);
  const interactionScore = evidence
    .filter((item) => ['ACCESSIBILITY', 'BEHAVIORAL'].includes(item.strategy))
    .reduce((total, item) => total + item.weight, 0);
  const confidenceScore = Math.max(0, relevanceScore + interactionScore);

  return { candidateId: candidate.id, score, relevanceScore, interactionScore, confidenceScore, evidence };
}
