import { createHash } from 'node:crypto';
import type { Frame, Locator, Page } from '@playwright/test';
import { scoreDiscoveryCandidate, type AdaptiveCandidateScore, type DiscoveryCandidate } from './AdaptiveDiscovery.js';
import { classifyExperiment, diffUiSnapshots, type DiscoveryExperimentResult, type UiSnapshot } from './AdaptiveDiscoveryExperiment.js';

const DEFAULT_MAX_CANDIDATES = 40;
const DEFAULT_MAX_CLICKS = 12;
const DEFAULT_SETTLE_MS = 350;
const HIGH_CONFIDENCE_THRESHOLD = 35;

export type AdaptiveDiscoveryRunnerOptions = {
  readonly maxCandidates?: number;
  readonly maxClicks?: number;
  readonly settleMs?: number;
  readonly highConfidenceThreshold?: number;
};

export type AdaptiveDiscoveryRun = {
  readonly experiments: readonly DiscoveryExperimentResult[];
  readonly selected?: DiscoveryExperimentResult;
  readonly candidatesConsidered: number;
  readonly clicksAttempted: number;
};

type CandidateHandle = {
  readonly locator: Locator;
  readonly candidate: AdaptiveCandidateScore;
  readonly key: string;
};

const UNSAFE_TERMS = /delete|remove|logout|log out|sign out|purchase|buy|checkout|pay|payment|subscribe|unsubscribe|cancel|confirm|submit order|eliminar|borrar|cerrar sesión|comprar|pagar|suscribir|cancelar/i;

export class AdaptiveDiscoveryExperimentRunner {
  public constructor(
    private readonly page: Page,
    private readonly options: AdaptiveDiscoveryRunnerOptions = {},
  ) {}

  public async run(): Promise<AdaptiveDiscoveryRun> {
    const candidates = await this.collectCandidates();
    const experiments: DiscoveryExperimentResult[] = [];
    let clicksAttempted = 0;

    for (const handle of candidates) {
      if (clicksAttempted >= (this.options.maxClicks ?? DEFAULT_MAX_CLICKS)) break;
      if (handle.candidate.score < (this.options.highConfidenceThreshold ?? HIGH_CONFIDENCE_THRESHOLD)) continue;

      const before = await this.snapshot();
      const beforeUrl = this.page.url();
      const clicked = await this.safeClick(handle.locator);
      if (!clicked) continue;
      clicksAttempted += 1;

      await this.page.waitForTimeout(this.options.settleMs ?? DEFAULT_SETTLE_MS);
      const after = await this.snapshot();
      const diff = diffUiSnapshots(before, after);
      const result: DiscoveryExperimentResult = {
        candidate: handle.candidate,
        before,
        after,
        diff,
        classification: classifyExperiment(diff),
      };
      experiments.push(result);

      if (result.classification === 'CHAT_SURFACE_CANDIDATE') {
        return { experiments, selected: result, candidatesConsidered: candidates.length, clicksAttempted };
      }

      await this.restoreAfterExperiment(beforeUrl);
    }

    return { experiments, candidatesConsidered: candidates.length, clicksAttempted };
  }

  private async collectCandidates(): Promise<CandidateHandle[]> {
    const handles: CandidateHandle[] = [];
    const contexts: Array<Page | Frame> = [this.page, ...this.page.frames().filter((frame) => frame !== this.page.mainFrame())];
    const maxCandidates = this.options.maxCandidates ?? DEFAULT_MAX_CANDIDATES;

    for (const context of contexts) {
      const interactive = context.locator('button, [role="button"]');
      const count = Math.min(await interactive.count(), maxCandidates - handles.length);
      for (let index = 0; index < count; index += 1) {
        const locator = interactive.nth(index);
        if (!await this.isSafeCandidate(locator)) continue;
        const candidate = await this.buildCandidate(locator);
        if (!candidate) continue;
        handles.push({ locator, candidate: scoreDiscoveryCandidate(candidate), key: this.candidateKey(candidate) });
        if (handles.length >= maxCandidates) return this.rankCandidates(handles);
      }
    }

    return this.rankCandidates(handles);
  }

  private rankCandidates(handles: CandidateHandle[]): CandidateHandle[] {
    return [...handles].sort((left, right) => right.candidate.score - left.candidate.score || left.key.localeCompare(right.key));
  }

  private async isSafeCandidate(locator: Locator): Promise<boolean> {
    if (!await locator.isVisible().catch(() => false)) return false;
    if (!await locator.isEnabled().catch(() => false)) return false;

    const text = await locator.innerText().catch(() => '');
    const ariaLabel = await locator.getAttribute('aria-label').catch(() => null);
    const title = await locator.getAttribute('title').catch(() => null);
    const fingerprint = `${text} ${ariaLabel ?? ''} ${title ?? ''}`.trim();
    if (UNSAFE_TERMS.test(fingerprint)) return false;

    const type = await locator.getAttribute('type').catch(() => null);
    if (type && /submit|reset/i.test(type)) return false;
    return true;
  }

  private async buildCandidate(locator: Locator): Promise<DiscoveryCandidate | null> {
    const box = await locator.boundingBox().catch(() => null);
    if (!box) return null;

    const tagName = await locator.evaluate((element) => element.tagName.toLowerCase()).catch(() => 'unknown');
    const explicitRole = await locator.getAttribute('role');
    const role = explicitRole ?? (tagName === 'button' ? 'button' : undefined);
    const ariaLabel = await locator.getAttribute('aria-label');
    const text = (await locator.innerText().catch(() => '')).trim().slice(0, 160);
    const placeholder = await locator.getAttribute('placeholder');
    const readonly = (await locator.getAttribute('readonly')) !== null;
    const disabled = (await locator.getAttribute('disabled')) !== null;
    const viewport = this.page.viewportSize();
    const fixed = await locator.evaluate((element) => getComputedStyle(element).position === 'fixed').catch(() => false);

    return {
      id: `${tagName}:${ariaLabel ?? text}:${box.x.toFixed(0)}:${box.y.toFixed(0)}`,
      tagName,
      role,
      ariaLabel,
      text,
      placeholder,
      readonly,
      disabled,
      fixed,
      bottomDistance: viewport ? Math.max(0, viewport.height - (box.y + box.height)) : undefined,
      rightDistance: viewport ? Math.max(0, viewport.width - (box.x + box.width)) : undefined,
    };
  }

  private candidateKey(candidate: DiscoveryCandidate): string {
    return `${candidate.tagName}|${candidate.role ?? ''}|${candidate.ariaLabel ?? ''}|${candidate.text ?? ''}|${candidate.id}`;
  }

  private async safeClick(locator: Locator): Promise<boolean> {
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 1_500 });
      await locator.click({ timeout: 3_000, noWaitAfter: true });
      return true;
    } catch {
      return false;
    }
  }

  private async restoreAfterExperiment(beforeUrl: string): Promise<void> {
    if (this.page.url() !== beforeUrl) {
      try {
        await this.page.goto(beforeUrl, { waitUntil: 'domcontentloaded', timeout: 8_000 });
      } catch {
        // A failed restore is evidence for the caller; the bounded run simply stops using this page state.
      }
    }
  }

  public async snapshot(): Promise<UiSnapshot> {
    const html = await this.page.locator('html').evaluate((element) => {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[id], [class], [style], [data-reactroot], [data-testid]').forEach((node) => {
        node.removeAttribute('id');
        node.removeAttribute('class');
        node.removeAttribute('style');
        node.removeAttribute('data-reactroot');
        node.removeAttribute('data-testid');
      });
      return clone.outerHTML;
    });
    const counts = await this.page.locator('body').evaluate((body) => {
      const visible = (element: Element): boolean => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      };
      const elements = Array.from(body.querySelectorAll('*'));
      return {
        visibleElementCount: elements.filter(visible).length,
        dialogCount: elements.filter((element) => element.matches('[role="dialog"], dialog')).filter(visible).length,
        textboxCount: elements.filter((element) => element.matches('textarea, input:not([type="hidden"]), [contenteditable="true"], [role="textbox"]')).filter(visible).length,
        formCount: elements.filter((element) => element.matches('form')).filter(visible).length,
        iframeCount: elements.filter((element) => element.matches('iframe')).filter(visible).length,
      };
    });

    return { domHash: createHash('sha256').update(html).digest('hex'), ...counts };
  }
}
