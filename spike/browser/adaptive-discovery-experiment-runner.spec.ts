import { test, expect } from '@playwright/test';
import { AdaptiveDiscoveryExperimentRunner } from '../../src/infrastructure/execution/playwright/discovery/AdaptiveDiscoveryExperimentRunner.js';

test('adaptive discovery identifies a launcher by behavioral DOM evidence', async ({ page }) => {
  await page.setContent(`
    <style>
      body { margin: 0; }
      #launcher { position: fixed; right: 16px; bottom: 16px; width: 56px; height: 56px; }
    </style>
    <button id="launcher" aria-label="Open assistant">?</button>
    <button aria-label="Share">Share</button>
    <script>
      document.querySelector('#launcher').addEventListener('click', () => {
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.innerHTML = '<textarea aria-label="Message"></textarea><button aria-label="Send">Send</button>';
        document.body.append(dialog);
      });
    </script>
  `);

  const runner = new AdaptiveDiscoveryExperimentRunner(page, { maxClicks: 4, settleMs: 0 });
  const result = await runner.run();

  expect(result.selected?.classification).toBe('CHAT_SURFACE_CANDIDATE');
  expect(result.selected?.diff.newTextboxes).toBe(1);
  expect(result.selected?.diff.newDialogs).toBe(1);
  expect(result.clicksAttempted).toBe(1);
});

test('adaptive discovery does not experiment with unsafe controls', async ({ page }) => {
  await page.setContent(`
    <button aria-label="Delete account">Delete</button>
    <button aria-label="Purchase">Buy</button>
    <button aria-label="Open assistant" style="position:fixed;right:16px;bottom:16px">?</button>
  `);

  const runner = new AdaptiveDiscoveryExperimentRunner(page, { maxClicks: 4, settleMs: 0 });
  const result = await runner.run();

  expect(result.experiments).toHaveLength(0);
  expect(result.clicksAttempted).toBe(0);
});

test('snapshot normalization ignores dynamic class, id and style changes', async ({ page }) => {
  await page.setContent('<div id="one" class="a" style="color:red">Hello</div>');
  const runner = new AdaptiveDiscoveryExperimentRunner(page);
  const before = await runner.snapshot();

  await page.evaluate(() => {
    const element = document.querySelector('div')!;
    element.id = 'two';
    element.className = 'b';
    element.setAttribute('style', 'color:blue');
  });

  const after = await runner.snapshot();
  expect(after.domHash).toBe(before.domHash);
});
