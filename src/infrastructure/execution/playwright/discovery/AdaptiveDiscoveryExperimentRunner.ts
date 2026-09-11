import { createHash } from 'node:crypto';
import type { Frame, Locator, Page } from '@playwright/test';
import { scoreDiscoveryCandidate, type AdaptiveCandidateScore, type DiscoveryCandidate } from './AdaptiveDiscovery.js';
import { classifyExperiment, diffUiSnapshots, type AdaptiveDiscoveryDebugAttempt, type DiscoveryExperimentResult, type UiSnapshot } from './AdaptiveDiscoveryExperiment.js';

const DEFAULT_MAX_CANDIDATES = 40;
const DEFAULT_MAX_CLICKS = 12;
const DEFAULT_SETTLE_MS = 350;

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
  readonly debug: readonly AdaptiveDiscoveryDebugAttempt[];
};

type CandidateHandle = {
  readonly locator: Locator;
  readonly context: Page | Frame;
  readonly candidate: AdaptiveCandidateScore;
  readonly key: string;
};

const UNSAFE_TERMS = /delete|remove|logout|log out|sign out|purchase|buy|checkout|pay|payment|subscribe|unsubscribe|cancel|confirm|submit order|eliminar|borrar|cerrar sesión|comprar|pagar|suscribir|cancelar/i;
const TRADITIONAL_NAVIGATION_SELECTOR = 'a[href], a[role="button"], [aria-controls], [aria-expanded], [onmousedown], [onmouseup], [ontouchstart], [onkeydown]';

export class AdaptiveDiscoveryExperimentRunner {
  public constructor(private readonly page: Page, private readonly options: AdaptiveDiscoveryRunnerOptions = {}) {}

  public async run(): Promise<AdaptiveDiscoveryRun> {
    const debug: AdaptiveDiscoveryDebugAttempt[] = [];
    const candidates = await this.collectCandidates(debug);
    const experiments: DiscoveryExperimentResult[] = [];
    let clicksAttempted = 0;
    const maxClicks = this.options.maxClicks ?? DEFAULT_MAX_CLICKS;

    for (const handle of candidates) {
      if (clicksAttempted >= maxClicks) break;
      const before = await this.snapshot(debug, 'SNAPSHOT_BEFORE');
      const beforeUrl = this.page.url();
      const clickResult = await this.safeClick(handle, debug);
      if (!clickResult.ok) continue;
      clicksAttempted += 1;
      await this.page.waitForTimeout(this.options.settleMs ?? DEFAULT_SETTLE_MS);
      const after = await this.snapshot(debug, 'SNAPSHOT_AFTER');
      const diff = diffUiSnapshots(before, after);
      const result: DiscoveryExperimentResult = { candidate: handle.candidate, before, after, diff, classification: classifyExperiment(diff) };
      experiments.push(result);
      if (result.classification === 'CHAT_SURFACE_CANDIDATE') return { experiments, selected: result, candidatesConsidered: candidates.length, clicksAttempted, debug };
      await this.restoreAfterExperiment(beforeUrl, handle, debug);
    }
    return { experiments, candidatesConsidered: candidates.length, clicksAttempted, debug };
  }

  private async collectCandidates(debug: AdaptiveDiscoveryDebugAttempt[]): Promise<CandidateHandle[]> {
    const handles: CandidateHandle[] = [];
    const seen = new Set<string>();
    const contexts: Array<Page | Frame> = [this.page, ...this.page.frames().filter((frame) => frame !== this.page.mainFrame())];
    const maxCandidates = this.options.maxCandidates ?? DEFAULT_MAX_CANDIDATES;
    for (const context of contexts) {
      const interactive = context.locator('button, [role="button"], [tabindex="0"], [onclick]');
      const traditional = context.locator(TRADITIONAL_NAVIGATION_SELECTOR);
      let rawCount = 0;
      try { rawCount = await interactive.count(); }
      catch (error) {
        debug.push({ candidateId: `context:${context.url()}`, score: 0, frameUrl: context.url(), stage: 'COLLECT', action: 'INSPECT', ok: false, error: this.errorMessage(error) });
        continue;
      }
      let traditionalCount = 0;
      try { traditionalCount = await traditional.count(); }
      catch (error) {
        debug.push({ candidateId: `context:${context.url()}`, score: 0, frameUrl: context.url(), stage: 'COLLECT', action: 'INSPECT', ok: false, error: this.errorMessage(error) });
      }
      const count = Math.min(Math.max(rawCount, traditionalCount), Math.max(0, maxCandidates * 3));
      for (let index = 0; index < count; index += 1) {
        const locators = [interactive.nth(index), traditional.nth(index)];
        for (const locator of locators) {
          if (!await this.isSafeCandidate(locator)) continue;
          const candidate = await this.buildCandidate(locator);
          if (!candidate) continue;
          const traditionalSignal = candidate.tagName === 'a' || Boolean(candidate.ariaControls) || candidate.ariaExpanded !== undefined || candidate.navigationSignal;
          const semanticLauncher = candidate.tagName === 'button' || candidate.role === 'button';
          if (!traditionalSignal && !semanticLauncher) continue;
          const key = this.candidateKey(candidate);
          if (seen.has(key)) continue;
          seen.add(key);
          const scored = scoreDiscoveryCandidate(candidate);
          handles.push({ locator, context, candidate: scored, key });
          debug.push({ candidateId: scored.candidateId, score: scored.score, frameUrl: context.url(), stage: 'COLLECT', action: 'INSPECT', ok: true });
        }
      }
    }
    return this.rankCandidates(handles).slice(0, maxCandidates);
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
    if (UNSAFE_TERMS.test(`${text} ${ariaLabel ?? ''} ${title ?? ''}`.trim())) return false;
    const type = await locator.getAttribute('type').catch(() => null);
    return !(type && /submit|reset/i.test(type));
  }

  private async buildCandidate(locator: Locator): Promise<DiscoveryCandidate | null> {
    const box = await locator.boundingBox().catch(() => null);
    if (!box) return null;
    const tagName = await locator.evaluate((element) => element.tagName.toLowerCase()).catch(() => 'unknown');
    const explicitRole = await locator.getAttribute('role');
    const role = explicitRole ?? (tagName === 'button' ? 'button' : undefined);
    const ariaLabel = await locator.getAttribute('aria-label').catch(() => null) ?? undefined;
    const text = (await locator.innerText().catch(() => '')).trim().slice(0, 160);
    const placeholder = await locator.getAttribute('placeholder').catch(() => null) ?? undefined;
    const href = await locator.getAttribute('href').catch(() => null) ?? undefined;
    const title = await locator.getAttribute('title').catch(() => null) ?? undefined;
    const name = await locator.getAttribute('name').catch(() => null) ?? undefined;
    const testId = await locator.getAttribute('data-testid').catch(() => null) ?? undefined;
    const ariaControls = await locator.getAttribute('aria-controls').catch(() => null) ?? undefined;
    const ariaExpanded = await locator.getAttribute('aria-expanded').catch(() => null) ?? undefined;
    const navigationSignal = await locator.evaluate((element) => ['onmousedown', 'onmouseup', 'ontouchstart', 'onkeydown'].some((name) => element.hasAttribute(name))).catch(() => false);
    const readonly = (await locator.getAttribute('readonly')) !== null;
    const disabled = (await locator.getAttribute('disabled')) !== null;
    const viewport = this.page.viewportSize();
    const fixed = await locator.evaluate((element) => getComputedStyle(element).position === 'fixed').catch(() => false);
    return {
      id: `${tagName}:${ariaLabel ?? text}:${box.x.toFixed(0)}:${box.y.toFixed(0)}`,
      tagName,
      ...(role ? { role } : {}),
      ...(ariaLabel ? { ariaLabel } : {}),
      text,
      ...(placeholder ? { placeholder } : {}),
      ...(href ? { href } : {}),
      ...(title ? { title } : {}),
      ...(name ? { name } : {}),
      ...(testId ? { testId } : {}),
      ...(ariaControls ? { ariaControls } : {}),
      ...(ariaExpanded !== undefined ? { ariaExpanded } : {}),
      ...(navigationSignal ? { navigationSignal } : {}),
      readonly,
      disabled,
      fixed,
      ...(viewport ? { bottomDistance: Math.max(0, viewport.height - (box.y + box.height)), rightDistance: Math.max(0, viewport.width - (box.x + box.width)) } : {}),
    };
  }

  private candidateKey(candidate: DiscoveryCandidate): string { return `${candidate.tagName}|${candidate.role ?? ''}|${candidate.ariaLabel ?? ''}|${candidate.text ?? ''}|${candidate.href ?? ''}|${candidate.title ?? ''}|${candidate.name ?? ''}|${candidate.testId ?? ''}|${candidate.ariaControls ?? ''}|${candidate.ariaExpanded ?? ''}|${candidate.navigationSignal ?? false}|${candidate.id}`; }

  private async safeClick(handle: CandidateHandle, debug: AdaptiveDiscoveryDebugAttempt[]): Promise<{ ok: boolean }> {
    const frameUrl = handle.context.url();
    const candidateId = handle.candidate.candidateId;
    try {
      await handle.locator.scrollIntoViewIfNeeded({ timeout: 1_500 });
      await handle.locator.click({ timeout: 3_000, noWaitAfter: true });
      debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK', ok: true });
      return { ok: true };
    } catch (firstError) {
      debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK', ok: false, error: this.errorMessage(firstError) });
      try {
        await handle.locator.scrollIntoViewIfNeeded({ timeout: 1_000 });
        await handle.locator.click({ timeout: 2_000, force: true, noWaitAfter: true });
        debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK_FORCE', ok: true });
        return { ok: true };
      } catch (forceError) {
        debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK_FORCE', ok: false, error: this.errorMessage(forceError) });
        return { ok: false };
      }
    }
  }

  private async restoreAfterExperiment(beforeUrl: string, handle: CandidateHandle, debug: AdaptiveDiscoveryDebugAttempt[]): Promise<void> {
    if (this.page.url() === beforeUrl) return;
    try {
      debug.push({ candidateId: handle.candidate.candidateId, score: handle.candidate.score, frameUrl: handle.context.url(), stage: 'RESTORE', action: 'RESTORE', ok: true });
      await this.page.goto(beforeUrl, { waitUntil: 'domcontentloaded', timeout: 8_000 });
    } catch (error) {
      debug.push({ candidateId: handle.candidate.candidateId, score: handle.candidate.score, frameUrl: handle.context.url(), stage: 'RESTORE', action: 'RESTORE', ok: false, error: this.errorMessage(error) });
    }
  }

  public async snapshot(debug: AdaptiveDiscoveryDebugAttempt[], stage: 'SNAPSHOT_BEFORE' | 'SNAPSHOT_AFTER'): Promise<UiSnapshot> {
    const contexts: Array<Page | Frame> = [this.page, ...this.page.frames().filter((frame) => frame !== this.page.mainFrame())];
    const parts: string[] = [];
    let visibleElementCount = 0; let dialogCount = 0; let textboxCount = 0; let formCount = 0; let iframeCount = 0;
    for (const context of contexts) {
      try {
        const html = await context.locator('html').evaluate(function (element) {
          const clone = element.cloneNode(true) as HTMLElement;
          const dynamicAttributes = ['id', 'class', 'style', 'data-reactroot', 'data-testid'];
          const nodes = clone.querySelectorAll('[id], [class], [style], [data-reactroot], [data-testid]');
          for (let index = 0; index < nodes.length; index += 1) {
            const node = nodes[index];
            for (let attributeIndex = 0; attributeIndex < dynamicAttributes.length; attributeIndex += 1) {
              node?.removeAttribute(dynamicAttributes[attributeIndex] as string);
            }
          }
          return clone.outerHTML;
        });
        parts.push(`${context.url()}|${html}`);
        const counts = await context.locator('body').evaluate(function (body) {
          const elements = Array.from(body.querySelectorAll('*'));
          let visibleElementCount = 0;
          let dialogCount = 0;
          let textboxCount = 0;
          let formCount = 0;
          let iframeCount = 0;
          for (let index = 0; index < elements.length; index += 1) {
            const element = elements[index];
            if (!element) continue;
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            const visible = style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
            if (!visible) continue;
            visibleElementCount += 1;
            if (element.matches('[role="dialog"], dialog')) dialogCount += 1;
            if (element.matches('textarea, input:not([type="hidden"]), [contenteditable="true"], [role="textbox"]')) textboxCount += 1;
            if (element.matches('form')) formCount += 1;
            if (element.matches('iframe')) iframeCount += 1;
          }
          return { visibleElementCount, dialogCount, textboxCount, formCount, iframeCount };
        });
        visibleElementCount += counts.visibleElementCount;
        dialogCount += counts.dialogCount;
        textboxCount += counts.textboxCount;
        formCount += counts.formCount;
        iframeCount += counts.iframeCount;
      } catch (error) {
        debug.push({ candidateId: `context:${context.url()}`, score: 0, frameUrl: context.url(), stage, action: 'INSPECT', ok: false, error: this.errorMessage(error) });
      }
    }
    return { domHash: createHash('sha256').update(parts.join('\n')).digest('hex'), visibleElementCount, dialogCount, textboxCount, formCount, iframeCount };
  }

  private errorMessage(error: unknown): string { return error instanceof Error ? `${error.name}: ${error.message}` : String(error); }

  private async sameElement(left: Locator, right: Locator): Promise<boolean> {
    const leftSignature = await this.elementSignature(left);
    if (!leftSignature) return false;
    const rightSignature = await this.elementSignature(right);
    return rightSignature !== null && rightSignature === leftSignature;
  }

  private async elementSignature(locator: Locator): Promise<string | null> {
    try {
      const count = await locator.count();
      if (count === 0) return null;
      return await locator.first().evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return JSON.stringify({
          tag: element.tagName.toLowerCase(),
          id: element.getAttribute('id'),
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          testId: element.getAttribute('data-testid'),
          name: element.getAttribute('name'),
          placeholder: element.getAttribute('placeholder'),
          text: (element.textContent ?? '').trim().slice(0, 256),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      });
    } catch {
      return null;
    }
  }
}
