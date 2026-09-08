import type { Locator, Page } from '@playwright/test';

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

    return this.waitForResponse(responseLocator, previous, timeoutMs);
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

  private async readResponseState(locator: Locator): Promise<{ count: number; value: string | null }> {
    const count = await locator.count();
    if (count === 0) return { count: 0, value: null };
    return { count, value: (await locator.last().textContent())?.trim() || null };
  }

  private async waitForResponse(
    locator: Locator,
    previous: { count: number; value: string | null },
    timeoutMs: number,
  ): Promise<string> {
    const deadline = Date.now() + Math.min(timeoutMs, this.responseTimeoutMs);
    while (Date.now() < deadline) {
      const current = await this.readResponseState(locator);
      if (current.count > previous.count && current.value) return current.value;
      if (current.count === previous.count && current.value && current.value !== previous.value) return current.value;
      await this.page.waitForTimeout(this.pollIntervalMs);
    }
    throw new Error('Conversation response was not observed before timeout');
  }
}
