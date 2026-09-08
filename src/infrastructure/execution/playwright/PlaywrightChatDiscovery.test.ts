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

    expect(discovered.composer.kind).toBe('locator');
    expect(discovered.sendButton?.kind).toBe('locator');
    expect(discovered.response.kind).toBe('locator');

    if (discovered.composer.kind !== 'locator') throw new Error('Expected locator definition');
    if (discovered.sendButton?.kind !== 'locator') throw new Error('Expected locator definition');
    if (discovered.response.kind !== 'locator') throw new Error('Expected locator definition');

    expect(await discovered.composer.value.getAttribute('placeholder')).toBe('Escribe un mensaje');
    expect(await discovered.sendButton.value.getAttribute('aria-label')).toBe('Enviar mensaje');
    expect(await discovered.response.value.getAttribute('role')).toBe('log');

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
