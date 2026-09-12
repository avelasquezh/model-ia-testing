import type { Page, Request, Response, WebSocket } from '@playwright/test';
import type { PlaywrightLocatorDefinition } from '../PlaywrightConversationUi.js';

export type NetworkEvidenceKind =
  | 'NETWORK_OUTBOUND_MESSAGE_CANDIDATE'
  | 'NETWORK_INBOUND_RESPONSE_CANDIDATE';

export type NetworkEvidenceEvent = {
  readonly kind: NetworkEvidenceKind;
  readonly transport: 'HTTP' | 'WEBSOCKET';
  readonly url: string;
  readonly method?: string;
  readonly status?: number;
  readonly contentType?: string;
  readonly timestamp: number;
  readonly matchedInput: boolean;
  readonly semanticUrlSignal: boolean;
  readonly confidence: number;
};

export type NetworkCorrelationResult = {
  readonly outbound: boolean;
  readonly inbound: boolean;
  readonly ordered: boolean;
  readonly confidence: number;
  readonly events: readonly NetworkEvidenceEvent[];
};

const IGNORED_URL = /analytics|telemetry|collect|tracking|pixel|beacon|google-analytics|doubleclick|sentry|hotjar|clarity/i;
const MESSAGE_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const CHAT_URL_TERMS = /chat|livechat|chatbox|messenger|message|messages|conversation|conversacion|support|help|assistant|contact|customer|bot|webhook|reply|response|stream/i;
const RESPONSE_TYPES = /json|event-stream|text\/plain|text\/html/i;

export class NetworkConversationEvidence {
  private readonly events: NetworkEvidenceEvent[] = [];
  private sendStartedAt = 0;
  private input = '';
  private readonly requests = new Map<Request, NetworkEvidenceEvent>();

  public constructor(private readonly page: Page) {}

  public start(input: string): void {
    this.input = input.trim();
    this.sendStartedAt = Date.now();
    this.page.on('request', this.onRequest);
    this.page.on('response', this.onResponse);
    this.page.on('websocket', this.onWebSocket);
  }

  public markSend(): void {
    this.sendStartedAt = Date.now();
  }

  public stop(): void {
    this.page.off('request', this.onRequest);
    this.page.off('response', this.onResponse);
    this.page.off('websocket', this.onWebSocket);
  }

  public correlate(): NetworkCorrelationResult {
    const orderedEvents = [...this.events].sort((left, right) => left.timestamp - right.timestamp);
    const outboundIndex = orderedEvents.findIndex((event) => event.kind === 'NETWORK_OUTBOUND_MESSAGE_CANDIDATE' && event.timestamp >= this.sendStartedAt);
    const inboundIndex = orderedEvents.findIndex((event, index) => event.kind === 'NETWORK_INBOUND_RESPONSE_CANDIDATE' && outboundIndex >= 0 && index > outboundIndex && event.timestamp >= this.sendStartedAt);
    const outbound = outboundIndex >= 0;
    const inbound = inboundIndex >= 0;
    const ordered = outbound && inbound;
    const outboundConfidence = outbound ? orderedEvents[outboundIndex]?.confidence ?? 0 : 0;
    const inboundConfidence = inbound ? orderedEvents[inboundIndex]?.confidence ?? 0 : 0;
    return {
      outbound,
      inbound,
      ordered,
      confidence: ordered ? Math.min(outboundConfidence, inboundConfidence) : Math.max(outboundConfidence, inboundConfidence),
      events: orderedEvents,
    };
  }

  private readonly onRequest = (request: Request): void => {
    if (request.isNavigationRequest() || isIgnoredUrl(request.url())) return;
    const postData = request.postData() ?? '';
    const url = request.url();
    const matchedInput = Boolean(this.input) && postData.toLowerCase().includes(this.input.toLowerCase());
    const semanticUrlSignal = CHAT_URL_TERMS.test(url);
    const method = request.method().toUpperCase();
    if (!MESSAGE_METHODS.has(method)) return;
    const structuredMessageSignal = matchedInput || containsMessageValue(postData, this.input);
    if (!structuredMessageSignal && !semanticUrlSignal) return;

    const confidence = Math.min(100,
      (matchedInput ? 60 : 0) +
      (structuredMessageSignal ? 15 : 0) +
      (semanticUrlSignal ? 20 : 0) +
      (MESSAGE_METHODS.has(method) ? 5 : 0),
    );
    const event: NetworkEvidenceEvent = {
      kind: 'NETWORK_OUTBOUND_MESSAGE_CANDIDATE', transport: 'HTTP', url, method,
      timestamp: Date.now(), matchedInput, semanticUrlSignal, confidence,
    };
    this.requests.set(request, event);
    this.events.push(event);
  };

  private readonly onResponse = (response: Response): void => {
    const request = response.request();
    if (request.isNavigationRequest() || isIgnoredUrl(response.url()) || Date.now() < this.sendStartedAt) return;
    const linkedRequest = this.requests.get(request);
    const contentType = response.headers()['content-type'] ?? '';
    const semanticUrlSignal = CHAT_URL_TERMS.test(response.url());
    const isResponseType = RESPONSE_TYPES.test(contentType);
    const statusSignal = response.status() >= 200 && response.status() < 500;
    const isEventStream = /event-stream/i.test(contentType);
    if (!linkedRequest && !isEventStream && !semanticUrlSignal) return;

    const confidence = Math.min(100,
      (linkedRequest ? 55 : 0) +
      (linkedRequest?.matchedInput ? 20 : 0) +
      (semanticUrlSignal ? 15 : 0) +
      (isResponseType ? 5 : 0) +
      (statusSignal ? 5 : 0),
    );
    this.events.push({
      kind: 'NETWORK_INBOUND_RESPONSE_CANDIDATE', transport: 'HTTP', url: response.url(),
      method: request.method().toUpperCase(), status: response.status(), contentType,
      timestamp: Date.now(), matchedInput: linkedRequest?.matchedInput ?? false,
      semanticUrlSignal, confidence,
    });
  };

  private readonly onWebSocket = (webSocket: WebSocket): void => {
    if (isIgnoredUrl(webSocket.url())) return;
    const semanticUrlSignal = CHAT_URL_TERMS.test(webSocket.url());
    webSocket.on('framesent', ({ payload }) => {
      const frame = typeof payload === 'string' ? payload : payload.toString();
      const matchedInput = Boolean(this.input) && frame.toLowerCase().includes(this.input.toLowerCase());
      if (!matchedInput && !semanticUrlSignal) return;
      this.events.push({
        kind: 'NETWORK_OUTBOUND_MESSAGE_CANDIDATE', transport: 'WEBSOCKET', url: webSocket.url(), timestamp: Date.now(),
        matchedInput, semanticUrlSignal, confidence: matchedInput ? 85 : 45,
      });
    });
    webSocket.on('framereceived', ({ payload }) => {
      if (Date.now() < this.sendStartedAt) return;
      const frame = typeof payload === 'string' ? payload : payload.toString();
      if (!frame.trim()) return;
      this.events.push({
        kind: 'NETWORK_INBOUND_RESPONSE_CANDIDATE', transport: 'WEBSOCKET', url: webSocket.url(), timestamp: Date.now(),
        matchedInput: false, semanticUrlSignal, confidence: semanticUrlSignal ? 75 : 45,
      });
    });
  };
}

export function locatorFromDefinition(page: Page, definition: PlaywrightLocatorDefinition) {
  switch (definition.kind) {
    case 'role': return page.getByRole(definition.role, definition.name === undefined ? undefined : { name: definition.name });
    case 'label': return page.getByLabel(definition.value);
    case 'placeholder': return page.getByPlaceholder(definition.value);
    case 'testId': return page.getByTestId(definition.value);
    case 'css': return page.locator(definition.value);
    case 'locator': return definition.value;
  }
}

function containsMessageValue(payload: string, input: string): boolean {
  if (!payload || !input) return false;
  const normalizedInput = input.trim().toLowerCase();
  if (!normalizedInput) return false;
  try {
    const parsed: unknown = JSON.parse(payload);
    return containsNestedValue(parsed, normalizedInput);
  } catch {
    return false;
  }
}

function containsNestedValue(value: unknown, normalizedInput: string): boolean {
  if (typeof value === 'string') return value.trim().toLowerCase().includes(normalizedInput);
  if (Array.isArray(value)) return value.some((item) => containsNestedValue(item, normalizedInput));
  if (value && typeof value === 'object') return Object.values(value).some((item) => containsNestedValue(item, normalizedInput));
  return false;
}

function isIgnoredUrl(url: string): boolean {
  return IGNORED_URL.test(url);
}
