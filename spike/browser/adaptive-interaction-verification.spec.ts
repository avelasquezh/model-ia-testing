import { test, expect } from '@playwright/test';
import { verifyAdaptiveInteraction } from '../../src/infrastructure/execution/playwright/discovery/AdaptiveInteractionVerification.js';

test('adaptive interaction verifies send and receive and records screenshots', async ({ page }, testInfo) => {
  await page.setContent(`
    <button id="launcher" aria-label="Open assistant">?</button>
    <script>
      document.querySelector('#launcher').addEventListener('click', () => {
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.innerHTML = '<textarea aria-label="Message"></textarea><button aria-label="Send">Send</button><div aria-live="polite"></div>';
        document.body.append(dialog);
        const send = dialog.querySelector('button');
        const input = dialog.querySelector('textarea');
        const response = dialog.querySelector('[aria-live]');
        send.addEventListener('click', () => {
          response.textContent = 'Hello back';
        });
        input.focus();
      });
    </script>
  `);
  await page.getByRole('button', { name: 'Open assistant' }).click();

  const evidenceDirectory = testInfo.outputPath('adaptive-interaction');
  const result = await verifyAdaptiveInteraction(page, 'fixture', 'Hello', evidenceDirectory, 5_000);

  expect(result.execution.conversation).toBe('VERIFIED');
  expect(result.execution.send).toBe('CONFIRMED');
  expect(result.execution.receive).toBe('CONFIRMED');
  expect(result.screenshotPaths).toHaveLength(2);
  expect(result.responseLength).toBeGreaterThan(0);
});
