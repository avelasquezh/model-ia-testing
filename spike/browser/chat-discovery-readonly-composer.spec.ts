import { test, expect } from '@playwright/test';
import { PlaywrightChatDiscovery } from '../../src/infrastructure/execution/playwright/PlaywrightChatDiscovery.js';

test('discovery skips readonly textbox candidates and selects an editable composer', async ({ page }) => {
  await page.setContent(`
    <main>
      <textarea aria-label="Message history" readonly>previous response</textarea>
      <textarea aria-label="Message" placeholder="Escribe un mensaje"></textarea>
      <button aria-label="Enviar mensaje">Enviar</button>
      <section role="log" aria-label="Conversation">Respuesta inicial</section>
    </main>
  `);

  const result = await new PlaywrightChatDiscovery(page).discoverWithEvidence();

  expect(result.report.status).toBe('DISCOVERED');
  expect(result.report.selected.composer?.strategy).toBe('main:role:textbox[name~message|mensaje|chat|escribe|type]');
  expect(result.config.composer.kind).toBe('locator');
  if (result.config.composer.kind !== 'locator') throw new Error('Expected locator composer');
  expect(await result.config.composer.value.getAttribute('aria-label')).toBe('Message');
  expect(await result.config.composer.value.isEditable()).toBe(true);
});
