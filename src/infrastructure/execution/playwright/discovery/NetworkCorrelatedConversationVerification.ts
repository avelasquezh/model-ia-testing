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
};

export type NetworkCorrelationResult = {
  readonly outbound: boolean;
  readonly inbound: boolean;
  readonly ordered: boolean;
  readonly events: readonly NetworkEvidenceEvent[];
};

const IGNORED_URL = /analytics|telemetry|collect|tracking|pixel|beacon|google-analytics|doubleclick|sentry/i;
const MESSAGE_METHODS = new Set(['POST', 'PUT', 'PATCH']);

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
    const inboundIndex = orderedEvents.findIndex((event, index) => event.kind === 'NETWORK_INBOUND_RESPONSE_CANDIDATE' && index > outboundIndex && event.timestamp >= this.sendStartedAt);
    return {
      outbound: outboundIndex >= 0,
      inbound: inboundIndex >= 0,
      ordered: outboundIndex >= 0 && inboundIndex > outboundIndex,
      events: orderedEvents,
    };
  }

  private readonly onRequest = (request: Request): void => {
    if (request.isNavigationRequest() || isIgnoredUrl(request.url())) return;
    const postData = request.postData() ?? '';
    const matchedInput = Boolean(this.input) && postData.toLowerCase().includes(this.input.toLowerCase());
    const method = request.method().toUpperCase();
    if (!matchedInput || !MESSAGE_METHODS.has(method)) return;
    const event: NetworkEvidenceEvent = {
      kind: 'NETWORK_OUTBOUND_MESSAGE_CANDIDATE', transport: 'HTTP', url: request.url(), method,
      timestamp: Date.now(), matchedInput,
    };
    this.requests.set(request, event);
    this.events.push(event);
  };

  private readonly onResponse = (response: Response): void => {
    const request = response.request();
    if (request.isNavigationRequest() || isIgnoredUrl(response.url()) || Date.now() < this.sendStartedAt) return;
    const linkedRequest = this.requests.get(request);
    const contentType = response.headers()['content-type'] ?? '';
    const isEventStream = /event-stream/i.test(contentType);
    if (!linkedRequest && !isEventStream) return;
    this.events.push({
      kind: 'NETWORK_INBOUND_RESPONSE_CANDIDATE', transport: 'HTTP', url: response.url(),
      method: request.method().toUpperCase(), status: response.status(), contentType,
      timestamp: Date.now(), matchedInput: linkedRequest?.matchedInput ?? false,
    });
  };

  private readonly onWebSocket = (webSocket: WebSocket): void => {
    if (isIgnoredUrl(webSocket.url())) return;
    webSocket.on('framesent', (payload) => {
      if (!this.input || !payload.toLowerCase().includes(this.input.toLowerCase())) return;
      this.events.push({ kind: 'NETWORK_OUTBOUND_MESSAGE_CANDIDATE', transport: 'WEBSOCKET', url: webSocket.url(), timestamp: Date.now(), matchedInput: true });
    });
    webSocket.on('framereceived', () => {
      if (Date.now() < this.sendStartedAt) return;
      this.events.push({ kind: 'NETWORK_INBOUND_RESPONSE_CANDIDATE', transport: 'WEBSOCKET', url: webSocket.url(), timestamp: Date.now(), matchedInput: false });
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

function isIgnoredUrl(url: string): boolean {
  return IGNORED_URL.test(url);
}
