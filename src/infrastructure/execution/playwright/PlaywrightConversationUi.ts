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
    const responseLocators = this.buildResponseLocators(responseLocator);
    const probes: ResponseProbe[] = [];

    for (const locator of responseLocators) {
      probes.push({ locator, previous: await this.readResponseState(locator) });
    }

    const composer = this.locate(this.config.composer);
    await composer.fill(input, { timeout: timeoutMs });

    if (this.config.sendButton) {
      await this.locate(this.config.sendButton).click({ timeout: timeoutMs });
    } else {
      await composer.press('Enter', { timeout: timeoutMs });
    }

    return this.waitForResponse(probes, input, timeoutMs);
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

  private buildResponseLocators(primary: Locator): Locator[] {
    return [
      primary,
      this.page.locator('[aria-live="polite"]'),
      this.page.locator('[aria-live="assertive"]'),
      this.page.getByRole('log'),
      this.page.locator('[data-testid*="message" i]'),
      this.page.locator('[class*="response" i]'),
      this.page.locator('[class*="message" i]'),
    ];
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
    probes: readonly ResponseProbe[],
    input: string,
    timeoutMs: number,
  ): Promise<string> {
    const deadline = Date.now() + Math.min(timeoutMs, this.responseTimeoutMs);
    const candidates = new Map<Locator, { response: string; polls: number }>();

    while (Date.now() < deadline) {
      for (const probe of probes) {
        const current = await this.readResponseState(probe.locator);
        const response = this.findNewResponse(probe.previous, current, input);
        if (!response || this.isTransientResponse(response)) continue;

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
