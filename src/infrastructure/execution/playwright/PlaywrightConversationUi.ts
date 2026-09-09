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

export class PlaywrightConversationUi implements ConversationUi {
  private readonly responseTimeoutMs: number;
  private readonly pollIntervalMs: number;

  public constructor(
    private readonly page: Page,
    private readonly config: PlaywrightConversationUiConfig,
  ) {
    this.responseTimeoutMs = config.responseTimeoutMs ?? 30_000;
    this.pollIntervalMs = config.pollIntervalMs ?? 100;
  }

  public async sendMessage(input: string, timeoutMs: number): Promise<string> {
    const responseLocator = this.locate(this.config.response);
    const previous = await this.readResponseState(responseLocator);
    const composer = this.locate(this.config.composer);
    await composer.fill(input, { timeout: timeoutMs });

    if (this.config.sendButton) {
      await this.locate(this.config.sendButton).click({ timeout: timeoutMs });
    } else {
      await composer.press('Enter', { timeout: timeoutMs });
    }

    return this.waitForResponse(responseLocator, previous, input, timeoutMs);
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
    const count = await locator.count();
    if (count === 0) return { count: 0, values: [] };

    const values: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const text = (await locator.nth(index).textContent())?.trim() || '';
      values.push(text);
    }
    return { count, values };
  }

  private async waitForResponse(
    locator: Locator,
    previous: ResponseState,
    input: string,
    timeoutMs: number,
  ): Promise<string> {
    const deadline = Date.now() + Math.min(timeoutMs, this.responseTimeoutMs);
    let candidate: string | null = null;
    let stablePolls = 0;

    while (Date.now() < deadline) {
      const current = await this.readResponseState(locator);
      const response = this.findNewResponse(previous, current, input);
      if (response && !this.isTransientResponse(response)) {
        if (response === candidate) {
          stablePolls += 1;
        } else {
          candidate = response;
          stablePolls = 1;
        }
        if (stablePolls >= 2) return response;
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
