import { test, expect } from '@playwright/test';
import { LegacySeededAdaptiveDiscovery } from '../../src/infrastructure/execution/playwright/discovery/LegacySeededAdaptiveDiscovery.js';

test('legacy-seeded adaptive ranks Legacy launcher evidence and discovers the chat surface', async ({ page }) => {
  await page.setContent(`
    <button id="chat" aria-label="Live chat support" title="Customer support">Help</button>
    <script>
      document.querySelector('#chat').addEventListener('click', () => {
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.innerHTML = '<textarea aria-label="Message"></textarea><button type="button">Send</button>';
        document.body.appendChild(dialog);
      });
    </script>
  `);

  const run = await new LegacySeededAdaptiveDiscovery(page, { maxSeeds: 10, maxClicks: 1, settleMs: 0 }).run();

  expect(run.model).toBe('LEGACY_SEEDED_ADAPTIVE');
  expect(run.seedsConsidered).toBeGreaterThan(0);
  expect(run.clicksAttempted).toBe(1);
  expect(run.selected?.classification).toBe('CHAT_SURFACE_CANDIDATE');
  expect(run.selected?.candidate.score).toBeGreaterThan(20);
});
