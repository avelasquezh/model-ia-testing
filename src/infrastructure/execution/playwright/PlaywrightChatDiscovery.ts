import type { Locator, Page } from '@playwright/test';
import type { PlaywrightConversationUiConfig, PlaywrightLocatorDefinition } from './PlaywrightConversationUi.js';

export class PlaywrightChatDiscovery {
  public constructor(private readonly page: Page) {}

  public async discover(): Promise<PlaywrightConversationUiConfig> {
    const composer = await this.findFirstVisible([
      this.page.getByRole('textbox', { name: /message|mensaje|chat|escribe|type/i }),
      this.page.getByPlaceholder(/message|mensaje|chat|escribe|type/i),
      this.page.locator('textarea'),
      this.page.locator('input[type="text"]'),
      this.page.locator('[contenteditable="true"]'),
    ]);

    if (!composer) {
      throw new Error('Chat composer could not be discovered on the public URL');
    }

    const sendButton = await this.findFirstVisible([
      this.page.getByRole('button', { name: /send|enviar|submit|mandar/i }),
      this.page.locator('button[aria-label*="send" i]'),
      this.page.locator('button[title*="send" i]'),
      this.page.locator('button[aria-label*="enviar" i]'),
      this.page.locator('button[title*="enviar" i]'),
    ]);

    const response = await this.findResponseLocator(composer);
    if (!response) {
      throw new Error('Chat response could not be discovered on the public URL');
    }

    return {
      composer: this.toDefinition(composer),
      response: this.toDefinition(response),
      ...(sendButton ? { sendButton: this.toDefinition(sendButton) } : {}),
    };
  }

  private async findResponseLocator(composer: Locator): Promise<Locator | null> {
    const candidates = [
      this.page.getByRole('log'),
      this.page.locator('[aria-live="polite"]'),
      this.page.locator('[aria-live="assertive"]'),
      this.page.locator('[data-testid*="message" i]'),
      this.page.locator('[class*="message" i]'),
      this.page.locator('[class*="response" i]'),
    ];

    for (const candidate of candidates) {
      const visible = await this.findFirstVisible([candidate]);
      if (visible && !(await this.isComposer(visible, composer))) return visible;
    }

    return null;
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

  private async isComposer(candidate: Locator, composer: Locator): Promise<boolean> {
    return candidate === composer;
  }

  private toDefinition(locator: Locator): PlaywrightLocatorDefinition {
    const testId = locator;
    void testId;
    throw new Error('Discovery result conversion requires a stable locator definition');
  }
}
