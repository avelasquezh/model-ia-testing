import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import type {
  BrowserAutomationPort,
  BrowserAutomationSession,
} from '../../../application/ports/BrowserAutomationPort.js';

export class PlaywrightBrowserAdapter implements BrowserAutomationPort {
  public async open(): Promise<PlaywrightBrowserSession> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    return new PlaywrightBrowserSession(browser, context, page);
  }
}

export class PlaywrightBrowserSession implements BrowserAutomationSession {
  public constructor(
    private readonly browser: Browser,
    private readonly context: BrowserContext,
    public readonly page: Page,
  ) {}

  public async navigate(url: string, timeoutMs: number): Promise<void> {
    await this.page.goto(url, { timeout: timeoutMs, waitUntil: 'domcontentloaded' });
  }

  public async close(): Promise<void> {
    await this.context.close();
    await this.browser.close();
  }
}
