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

    if (!composer) throw new Error('Chat composer could not be discovered on the public URL');

    const sendButton = await this.findFirstVisible([
      this.page.getByRole('button', { name: /send|enviar|submit|mandar/i }),
      this.page.locator('button[aria-label*="send" i]'),
      this.page.locator('button[title*="send" i]'),
      this.page.locator('button[aria-label*="enviar" i]'),
      this.page.locator('button[title*="enviar" i]'),
    ]);

    const response = await this.findFirstVisibleExcluding(
      [
        this.page.locator('[data-testid*="message" i]'),
        this.page.locator('[aria-live="polite"]'),
        this.page.locator('[aria-live="assertive"]'),
        this.page.getByRole('log'),
        this.page.locator('[class*="response" i]'),
        this.page.locator('[class*="message" i]'),
      ],
      [composer, sendButton],
    );

    if (!response) throw new Error('Chat response could not be discovered on the public URL');

    return {
      composer: this.toDefinition(composer),
      response: this.toDefinition(response),
      ...(sendButton ? { sendButton: this.toDefinition(sendButton) } : {}),
    };
  }

  private async findFirstVisible(candidates: Locator[]): Promise<Locator | null> {
    return this.findFirstVisibleExcluding(candidates, []);
  }

  private async findFirstVisibleExcluding(candidates: Locator[], excluded: Array<Locator | null>): Promise<Locator | null> {
    for (const candidate of candidates) {
      const count = await candidate.count();
      for (let index = 0; index < count; index += 1) {
        const item = candidate.nth(index);
        if (!await item.isVisible()) continue;
        if (await this.isExcluded(item, excluded)) continue;
        return item;
      }
    }
    return null;
  }

  private async isExcluded(candidate: Locator, excluded: Array<Locator | null>): Promise<boolean> {
    for (const locator of excluded) {
      if (!locator) continue;
      const count = await locator.count();
      for (let index = 0; index < count; index += 1) {
        if (await locator.nth(index).evaluate((node, candidateNode) => node === candidateNode, await candidate.elementHandle())) {
          return true;
        }
      }
    }
    return false;
  }

  private toDefinition(locator: Locator): PlaywrightLocatorDefinition {
    return { kind: 'locator', value: locator };
  }
}
