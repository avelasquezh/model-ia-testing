import type { Locator, Page } from '@playwright/test';

export type DiscoveredChatUi = {
  readonly composer: Locator;
  readonly response: Locator;
  readonly sendButton?: Locator;
};

export class PlaywrightChatDiscovery {
  public constructor(private readonly page: Page) {}

  public async discover(): Promise<DiscoveredChatUi> {
    const composer = await this.findFirstVisible([
      this.page.getByRole('textbox', { name: /message|mensaje|chat|escribe|type/i }),
      this.page.getByPlaceholder(/message|mensaje|chat|escribe|type/i),
      this.page.locator('textarea'),
      this.page.locator('input[type="text"]'),
      this.page.locator('[contenteditable="true"]'),
    ]);

    if (!composer) throw new Error('Chat composer could not be discovered on the public URL');

    const sendButton = await this.findFirstVisible([
      this.page.getByRole('button', { name: /send|enviar|submit|mandar/i }),
      this.page.locator('button[aria-label*="send" i]'),
      this.page.locator('button[title*="send" i]'),
      this.page.locator('button[aria-label*="enviar" i]'),
      this.page.locator('button[title*="enviar" i]'),
    ]);

    const response = await this.findFirstVisible([
      this.page.getByRole('log'),
      this.page.locator('[aria-live="polite"]'),
      this.page.locator('[aria-live="assertive"]'),
      this.page.locator('[data-testid*="message" i]'),
      this.page.locator('[class*="message" i]'),
      this.page.locator('[class*="response" i]'),
    ]);

    if (!response) throw new Error('Chat response could not be discovered on the public URL');

    return { composer, response, ...(sendButton ? { sendButton } : {}) };
  }

  private async findFirstVisible(candidates: Locator[]): Promise<Locator | null> {
    for (const candidate of candidates) {
      const count = await candidate.count();
      for (let index = 0; index < count; index += 1) {
        const item = candidate.nth(index);
        if (await item.isVisible()) return item;
      }
    }
    return null;
  }
}
