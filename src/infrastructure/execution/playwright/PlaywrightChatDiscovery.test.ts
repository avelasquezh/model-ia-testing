import { chromium } from '@playwright/test';
import { afterAll, describe, expect, it } from 'vitest';
import { PlaywrightChatDiscovery } from './PlaywrightChatDiscovery.js';
import type { PlaywrightLocatorDefinition } from './PlaywrightConversationUi.js';

const browser = await chromium.launch({ headless: true });

afterAll(async () => {
  await browser.close();
});

describe('PlaywrightChatDiscovery', () => {
  it('discovers composer, send button and response with provider-neutral strategies', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(`
      <main>
        <label for="message">Mensaje</label>
        <input id="message" placeholder="Escribe tu mensaje" />
        <button aria-label="Enviar mensaje">Enviar</button>
        <section aria-live="polite">Respuesta inicial</section>
      </main>
    `);

    const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

    expect(result.report.status).toBe('DISCOVERED');
    expect(result.report.selected.composer?.strategy).toContain('textbox');
    expect(result.report.selected.sendButton?.strategy).toContain('aria-label*=enviar');
    expect(result.report.selected.response?.strategy).toBe('main:[aria-live=polite]');
    expect(result.report.candidates.some((candidate) => candidate.role === 'composer' && candidate.selected)).toBe(true);
    expect(result.report.candidates.some((candidate) => candidate.role === 'sendButton' && candidate.selected)).toBe(true);
    expect(result.report.candidates.some((candidate) => candidate.role === 'response' && candidate.selected)).toBe(true);

    await context.close();
  });

  it('retains a deferred response locator when the response is mounted after send', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(`
      <main>
        <label for="message">Mensaje</label>
        <input id="message" placeholder="Escribe tu mensaje" />
        <button aria-label="Enviar mensaje">Enviar</button>
        <script>
          document.querySelector('button').addEventListener('click', () => {
            const response = document.createElement('section');
            response.setAttribute('aria-live', 'polite');
            response.textContent = 'Respuesta montada después de enviar';
            document.querySelector('main').appendChild(response);
          });
        </script>
      </main>
    `);

    const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

    expect(result.report.status).toBe('DISCOVERED');
    expect(result.report.selected.response?.strategy).toBe('main:[aria-live=polite]');
    expect(result.report.selected.response?.deferred).toBe(true);
    expect(result.report.selected.response?.evidence).toBeUndefined();
    expect(result.config.response.kind).toBe('locator');
    if (result.config.response.kind !== 'locator') throw new Error('Expected a live response locator');
    expect(await result.config.response.value.count()).toBe(0);

    await page.getByRole('button', { name: 'Enviar mensaje' }).click();
    expect(await result.config.response.value.textContent()).toBe('Respuesta montada después de enviar');

    const responseCandidate = result.report.candidates.find(
      (candidate) => candidate.role === 'response' && candidate.selected,
    );
    expect(responseCandidate?.deferred).toBe(true);
    expect(responseCandidate?.matched).toBe(false);

    await context.close();
  });

  it('records nested-widget traversal path before finding the child composer', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(`
      <main>
        <button aria-label="Abrir asistente">Ayuda</button>
        <script>
          document.querySelector('button').addEventListener('click', () => {
            const chat = document.createElement('div');
            chat.innerHTML = '<input aria-label="Escribe tu mensaje" /><button aria-label="Enviar">Enviar</button><section aria-live="polite">Respuesta</section>';
            document.querySelector('main').appendChild(chat);
          });
        </script>
      </main>
    `);

    const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

    expect(result.report.status).toBe('DISCOVERED');
    expect(result.report.traversalPath.length).toBeGreaterThan(0);
    expect(result.report.traversalPath[0]?.strategy).toContain('role=button');
    expect(result.report.traversalPath[0]?.evidence.ariaLabel).toBe('Abrir asistente');
    expect(result.report.selected.composer?.strategy).toContain('aria-label=');

    await context.close();
  });

  it('discovers chat controls inside an open shadow root', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(`
      <main>
        <chat-shell></chat-shell>
        <script>
          const host = document.querySelector('chat-shell');
          const root = host.attachShadow({ mode: 'open' });
          root.innerHTML = '<input aria-label="Mensaje" /><button aria-label="Enviar">Enviar</button><section aria-live="polite">Respuesta</section>';
        </script>
      </main>
    `);

    const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

    expect(result.report.status).toBe('DISCOVERED');
    expect(result.report.selected.composer?.strategy).toContain('aria-label=');
    expect(result.report.selected.response?.strategy).toContain('aria-live=polite');

    await context.close();
  });
});
