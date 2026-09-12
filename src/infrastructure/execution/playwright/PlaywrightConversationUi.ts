import type { Locator, Page } from '@playwright/test';

export class ConversationResponseTimeoutError extends Error {
  public override readonly name = 'RESPONSE_TIMEOUT';

  public constructor() {
    super('Conversation response was not observed before timeout');
  }
}

export type PlaywrightLocatorDefinition =
  | { readonly kind: 'role'; readonly role: Parameters<Page['getByRole']>[0]; readonly name?: string | RegExp }
  | { readonly kind: 'label'; readonly value: string | RegExp }
  | { readonly kind: 'placeholder'; readonly value: string | RegExp }
  | { readonly kind: 'testId'; readonly value: string }
  | { readonly kind: 'css'; readonly value: string }
  | { readonly kind: 'locator'; readonly value: Locator };

export type PlaywrightConversationUiConfig = {
  readonly composer: PlaywrightLocatorDefinition;
  readonly sendButton?: PlaywrightLocatorDefinition;
  readonly response: PlaywrightLocatorDefinition;
  readonly responseTimeoutMs?: number;
  readonly pollIntervalMs?: number;
};

export interface ConversationUi {
  sendMessage(input: string, timeoutMs: number): Promise<string>;
}

type ResponseState = {
  readonly count: number;
  readonly values: readonly string[];
};

type ResponseProbe = {
  readonly locator: Locator;
  readonly previous: ResponseState;
};

type NetworkActivityKind = 'ws-sent' | 'ws-received' | 'http-response';

type NetworkActivityEvent = {
  readonly kind: NetworkActivityKind;
  readonly at: number;
};

/**
 * Muchos chatbots modernos entregan la respuesta de forma incremental por WebSocket
 * o SSE/XHR (streaming). El DOM puede "estabilizarse" momentáneamente entre tokens,
 * lo que produce falsos positivos (se acepta un fragmento parcial) o falsos timeouts
 * (se agota el plazo mientras el bot sigue generando). Esta señal es complementaria
 * a la evidencia de DOM, nunca la reemplaza: solo evita declarar una respuesta como
 * definitiva mientras hay tráfico de red asociado todavía en curso.
 */
export class PlaywrightConversationUi implements ConversationUi {
  private readonly responseTimeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly networkIdleGraceMs: number;
  private readonly networkEvents: NetworkActivityEvent[] = [];

  public constructor(
    private readonly page: Page,
    private readonly config: PlaywrightConversationUiConfig,
  ) {
    this.responseTimeoutMs = config.responseTimeoutMs ?? 30_000;
    this.pollIntervalMs = config.pollIntervalMs ?? 100;
    this.networkIdleGraceMs = Math.max(this.pollIntervalMs * 2, 250);
    this.attachNetworkListeners();
  }

  public async sendMessage(input: string, timeoutMs: number): Promise<string> {
    const responseLocator = this.locate(this.config.response);
    const responseState = await this.readResponseState(responseLocator);
    const probes: ResponseProbe[] = [{ locator: responseLocator, previous: responseState }];

    for (const selector of ['[aria-live]', '[role="log"]', '[role="status"]']) {
      const locator = this.page.locator(selector);
      probes.push({ locator, previous: await this.readResponseState(locator) });
    }

    const composer = this.locate(this.config.composer);
    await composer.fill(input, { timeout: timeoutMs });

    const sentAt = Date.now();

    if (this.config.sendButton) {
      await this.locate(this.config.sendButton).click({ timeout: timeoutMs });
    } else {
      await composer.press('Enter', { timeout: timeoutMs });
    }

    return this.waitForResponse(probes, input, timeoutMs, sentAt);
  }

  /**
   * Escucha, a nivel de página, tráfico de WebSocket y de respuestas xhr/fetch.
   * Se adjunta una sola vez en el constructor porque el widget puede abrir su
   * conexión antes de que se dispare sendMessage; perder ese evento de creación
   * impediría suscribirse a sus frames más adelante.
   */
  private attachNetworkListeners(): void {
    this.page.on('websocket', (webSocket) => {
      webSocket.on('framesent', () => this.recordNetworkEvent('ws-sent'));
      webSocket.on('framereceived', () => this.recordNetworkEvent('ws-received'));
    });

    this.page.on('response', (response) => {
      const resourceType = response.request().resourceType();
      if (resourceType === 'xhr' || resourceType === 'fetch') {
        this.recordNetworkEvent('http-response');
      }
    });
  }

  private recordNetworkEvent(kind: NetworkActivityKind): void {
    this.networkEvents.push({ kind, at: Date.now() });
  }

  /**
   * Milisegundos transcurridos desde la última actividad de red entrante
   * (frame de WebSocket recibido o respuesta xhr/fetch) posterior a `sinceAt`.
   * Devuelve null si no se observó ninguna actividad relevante todavía.
   */
  private msSinceLastInboundNetworkActivity(sinceAt: number): number | null {
    let lastAt: number | null = null;
    for (const event of this.networkEvents) {
      if (event.kind === 'ws-sent' || event.at < sinceAt) continue;
      if (lastAt === null || event.at > lastAt) lastAt = event.at;
    }
    return lastAt === null ? null : Date.now() - lastAt;
  }

  private locate(definition: PlaywrightLocatorDefinition): Locator {
    switch (definition.kind) {
      case 'role':
        return this.page.getByRole(definition.role, definition.name === undefined ? undefined : { name: definition.name });
      case 'label':
        return this.page.getByLabel(definition.value);
      case 'placeholder':
        return this.page.getByPlaceholder(definition.value);
      case 'testId':
        return this.page.getByTestId(definition.value);
      case 'css':
        return this.page.locator(definition.value);
      case 'locator':
        return definition.value;
    }
  }

  private async readResponseState(locator: Locator): Promise<ResponseState> {
    try {
      const count = await locator.count();
      if (count === 0) return { count: 0, values: [] };

      const values: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const text = (await locator.nth(index).textContent())?.trim() || '';
        values.push(text);
      }
      return { count, values };
    } catch {
      return { count: 0, values: [] };
    }
  }

  private async waitForResponse(
    probes: readonly ResponseProbe[],
    input: string,
    timeoutMs: number,
    sentAt: number,
  ): Promise<string> {
    const deadline = Date.now() + Math.min(timeoutMs, this.responseTimeoutMs);
    const candidates = new Map<Locator, { response: string; polls: number }>();

    while (Date.now() < deadline) {
      const idleForMs = this.msSinceLastInboundNetworkActivity(sentAt);
      const networkStillFlowing = idleForMs !== null && idleForMs < this.networkIdleGraceMs;

      for (const probe of probes) {
        const current = await this.readResponseState(probe.locator);
        const response = this.findNewResponse(probe.previous, current, input);
        if (!response || this.isTransientResponse(response)) continue;
        // Hay tráfico de red asociado todavía activo (streaming/SSE/WS): el texto
        // actual puede ser un fragmento parcial, no la respuesta final. Se espera
        // a que la red se calme antes de empezar a contar estabilidad en el DOM.
        if (networkStillFlowing) continue;

        const previousCandidate = candidates.get(probe.locator);
        const polls = previousCandidate?.response === response ? previousCandidate.polls + 1 : 1;
        candidates.set(probe.locator, { response, polls });
        if (polls >= 2) return response;
      }

      await this.page.waitForTimeout(this.pollIntervalMs);
    }
    throw new ConversationResponseTimeoutError();
  }

  private isTransientResponse(value: string): boolean {
    return /^(typing|escribiendo|thinking|pensando|generating|generando)(?:\.{2,}|…+|\s*)$/i.test(value.trim());
  }

  private findNewResponse(previous: ResponseState, current: ResponseState, input: string): string | null {
    const previousValues = new Set(previous.values.filter(Boolean));
    const normalizedInput = input.trim();

    for (let index = 0; index < current.values.length; index += 1) {
      const value = current.values[index]?.trim() ?? '';
      if (!value || value === normalizedInput) continue;
      if (!previousValues.has(value)) return value;

      const previousAtIndex = previous.values[index]?.trim() ?? '';
      if (value !== previousAtIndex && value !== normalizedInput) return value;
    }

    if (current.count > previous.count) {
      for (let index = previous.count; index < current.values.length; index += 1) {
        const value = current.values[index]?.trim() ?? '';
        if (value && value !== normalizedInput) return value;
      }
    }

    return null;
  }
}
