import { chromium, type Page } from '@playwright/test';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PlaywrightChatDiscovery } from './PlaywrightChatDiscovery.js';
import type { PlaywrightLocatorDefinition } from './PlaywrightConversationUi.js';

const browser = await chromium.launch({ headless: true });
let context: Awaited<ReturnType<typeof browser.newContext>>;
let page: Page;

beforeAll(async () => {
  context = await browser.newContext();
  page = await context.newPage();
});

beforeEach(async () => {
  await page.goto('about:blank');
});

afterAll(async () => {
  await page.close();
  await context.close();
  await browser.close();
});

describe('PlaywrightChatDiscovery', () => {
  it('discovers a composer, send button and response container without provider-specific selectors', async () => {
    await page.setContent(`
      <main>
        <section role="log" aria-label="Conversation" style="display:block;width:300px;height:100px;">Respuesta inicial</section>
        <input placeholder="Escribe un mensaje" />
        <button aria-label="Enviar mensaje">Enviar</button>
      </main>
    `);

    const discovered = await new PlaywrightChatDiscovery(page).discover();

    expect(discovered.composer.kind).toBe('locator');
    expect(discovered.sendButton?.kind).toBe('locator');
    expect(discovered.response.kind).toBe('locator');

    expect(await locatorAttribute(discovered.composer, 'placeholder')).toBe('Escribe un mensaje');
    expect(await locatorAttribute(discovered.sendButton!, 'aria-label')).toBe('Enviar mensaje');
    expect(await locatorAttribute(discovered.response, 'role')).toBe('log');
  });

  it('emits serializable evidence showing selected strategies and element attributes', async () => {
    await page.setContent(`
      <main>
        <section role="log" aria-label="Conversation">Respuesta inicial</section>
        <input placeholder="Escribe un mensaje" data-testid="composer" />
        <button aria-label="Enviar mensaje">Enviar</button>
      </main>
    `);

    const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

    expect(result.report.schemaVersion).toBe('chat-discovery-0.1');
    expect(result.report.status).toBe('DISCOVERED');
    expect(result.report.targetUrl).toContain('about:blank');
    expect(result.report.selected.composer?.strategy).toBe('main:role:textbox[name~message|mensaje|chat|escribe|type]');
    expect(result.report.selected.composer?.confidence).toBe('HIGH');
    expect(result.report.selected.composer?.evidence?.placeholder).toBe('Escribe un mensaje');
    expect(result.report.selected.sendButton?.strategy).toBe('main:role:button[name~send|enviar|submit|mandar]');
    expect(result.report.selected.response?.strategy).toBe('main:role=log');
    expect(result.report.candidates.some((candidate) => candidate.selected)).toBe(true);
  });

  it('traverses a parent widget to reveal a nested chat composer', async () => {
    await page.setContent(`
      <main>
        <button aria-label="Abrir atención al cliente" id="outer-widget">Atención</button>
        <section id="chat" style="display:none" aria-label="Chat">
          <section role="log">Respuesta inicial</section>
          <input id="composer" placeholder="Escribe un mensaje" />
          <button aria-label="Enviar mensaje">Enviar</button>
        </section>
        <script>
          document.getElementById('outer-widget').addEventListener('click', () => {
            document.getElementById('chat').style.display = 'block';
          });
        </script>
      </main>
    `);

    const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

    expect(await locatorAttribute(result.config.composer, 'id')).toBe('composer');
    expect(result.report.traversalPath?.length).toBeGreaterThan(0);
    expect(result.report.traversalPath?.some((step) => step.evidence?.ariaLabel === 'Abrir atención al cliente')).toBe(true);
  });

  it('traverses a parent widget before discovering a chat inside an open shadow root', async () => {
    await page.setContent(`
      <main>
        <button aria-label="Abrir servicios" id="outer-widget">Servicios</button>
        <chat-shell></chat-shell>
        <script>
          const host = document.querySelector('chat-shell');
          const shadow = host.attachShadow({ mode: 'open' });
          shadow.innerHTML = '<section style="display:none" id="chat"><section role="log">Respuesta inicial</section><input placeholder="Escribe un mensaje" /><button aria-label="Enviar mensaje">Enviar</button></section>';
          document.getElementById('outer-widget').addEventListener('click', () => {
            shadow.querySelector('#chat').style.display = 'block';
          });
        </script>
      </main>
    `);

    const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

    expect(await locatorAttribute(result.config.composer, 'placeholder')).toBe('Escribe un mensaje');
    expect(result.report.traversalPath?.some((step) => step.evidence?.ariaLabel === 'Abrir servicios')).toBe(true);
  });

  it(
    'retains a deferred response locator when the response is mounted after send',
    async () => {
      const isolatedPage = await context.newPage();
      try {
        console.log('[deferred] page created');
        await isolatedPage.goto('about:blank');
        console.log('[deferred] blank loaded');
        await isolatedPage.locator('body').evaluate((body) => {
          body.innerHTML = `
            <main>
              <label for="message">Mensaje</label>
              <input id="message" placeholder="Escribe tu mensaje" />
              <button aria-label="Enviar mensaje">Enviar</button>
            </main>
          `;
        });
        console.log('[deferred] dom mounted');

        const sendButton = isolatedPage.getByRole('button', { name: 'Enviar mensaje' });
        await sendButton.evaluate((button) => {
          button.addEventListener('click', () => {
            const response = document.createElement('section');
            response.setAttribute('aria-live', 'polite');
            response.textContent = 'Respuesta montada después de enviar';
            document.querySelector('main')?.appendChild(response);
          });
        });
        console.log('[deferred] listener attached');

        const discovery = new PlaywrightChatDiscovery(isolatedPage);
        const tracedMethods = new Set([
          'dismissConsentBanners',
          'findVisibleCaptchaGate',
          'searchContexts',
          'findFirstVisible',
          'recordCandidates',
          'findResponseLocator',
          'selection',
          'sameElement',
          'elementEvidence',
          'toDefinition',
        ]);
        const tracedDiscovery = new Proxy(discovery, {
          get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (typeof property !== 'string' || !tracedMethods.has(property) || typeof value !== 'function') {
              return value;
            }
            return (...args: unknown[]) => {
              console.log(`[deferred-stage] enter ${property}`);
              try {
                const result = value.apply(receiver, args);
                if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
                  return result.then(
                    (resolved: unknown) => {
                      console.log(`[deferred-stage] exit ${property}`);
                      return resolved;
                    },
                    (error: unknown) => {
                      console.log(`[deferred-stage] error ${property}: ${error instanceof Error ? error.message : String(error)}`);
                      throw error;
                    },
                  );
                }
                console.log(`[deferred-stage] exit ${property}`);
                return result;
              } catch (error) {
                console.log(`[deferred-stage] error ${property}: ${error instanceof Error ? error.message : String(error)}`);
                throw error;
              }
            };
          },
        });

        const result = await tracedDiscovery.discoverWithEvidence();
        console.log('[deferred] discovery completed');

        expect(result.report.status).toBe('DISCOVERED');
        expect(result.report.selected.response?.strategy).toBe('main:[aria-live=polite]');
        expect(result.report.selected.response?.deferred).toBe(true);
        expect(result.report.selected.response?.evidence).toBeUndefined();
        expect(result.config.response.kind).toBe('locator');
        if (result.config.response.kind !== 'locator') throw new Error('Expected a live response locator');
        expect(await result.config.response.value.count()).toBe(0);
        console.log('[deferred] pre-send assertions completed');

        await sendButton.dispatchEvent('click');
        console.log('[deferred] click dispatched');
        expect(await result.config.response.value.count()).toBe(1);
        expect(await result.config.response.value.textContent()).toBe('Respuesta montada después de enviar');
        console.log('[deferred] response assertions completed');

        const responseCandidate = result.report.candidates.find(
          (candidate) => candidate.role === 'response' && candidate.selected,
        );
        expect(responseCandidate?.deferred).toBe(true);
        expect(responseCandidate?.matched).toBe(false);
      } finally {
        console.log('[deferred] closing page');
        await isolatedPage.close();
      }
    },
    15_000,
  );
});

async function locatorAttribute(definition: PlaywrightLocatorDefinition, attribute: string): Promise<string | null> {
  if (definition.kind !== 'locator') {
    throw new Error(`Expected a discovered locator definition, received ${definition.kind}`);
  }
  return definition.value.getAttribute(attribute);
}
