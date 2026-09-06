import { chromium, type Browser, type Page } from '@playwright/test';
import type { BrowserPort } from '../application/ports/BrowserPort.js';

export class PlaywrightBrowserAdapter implements BrowserPort {
  private browser?: Browser;
  private page?: Page;

  public async open(targetUrl: string): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.page) throw new Error('Browser session is not initialized');
    await this.page.locator('body').evaluate((body, value) => {
      body.setAttribute('data-spike-message', String(value));
    }, message);
    return this.page.locator('body').innerText();
  }

  public async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
    this.page = undefined;
  }
}
