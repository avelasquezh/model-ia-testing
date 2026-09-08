import { chromium } from '@playwright/test';
import { afterAll, describe, expect, it } from 'vitest';
import { PlaywrightChatDiscovery } from './PlaywrightChatDiscovery.js';

const browser = await chromium.launch({ headless: true });

afterAll(async () => {
  await browser.close();
});

describe('PlaywrightChatDiscovery', () => {
  it('discovers a composer, send button and response container without provider-specific selectors', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(`
      <main>
        <section role="log" aria-label="Conversation"></section>
        <input placeholder="Escribe un mensaje" />
        <button aria-label="Enviar mensaje">Enviar</button>
      </main>
    `);

    const discovered = await new PlaywrightChatDiscovery(page).discover();

    await expect(discovered.composer).toHaveAttribute('placeholder', 'Escribe un mensaje');
    await expect(discovered.sendButton!).toHaveAttribute('aria-label', 'Enviar mensaje');
    await expect(discovered.response).toHaveAttribute('role', 'log');

    await context.close();
  });

  it('fails explicitly when no response container can be discovered', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent('<input placeholder="Escribe un mensaje" />');

    await expect(new PlaywrightChatDiscovery(page).discover()).rejects.toThrow(
      'Chat response could not be discovered on the public URL',
    );

    await context.close();
  });
});
