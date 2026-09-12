import type { Frame, Locator, Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { scoreDiscoveryCandidate, type AdaptiveCandidateScore, type DiscoveryCandidate } from './AdaptiveDiscovery.js';
import { classifyExperiment, diffUiSnapshots, type AdaptiveDiscoveryDebugAttempt, type DiscoveryExperimentResult, type UiSnapshot } from './AdaptiveDiscoveryExperiment.js';
import { ChatDiscoveryError, PlaywrightChatDiscovery } from '../PlaywrightChatDiscovery.js';
import type { ChatDiscoveryCandidate, ChatDiscoveryReport } from '../ChatDiscoveryReport.js';

type SeedHandle = {
  readonly source: ChatDiscoveryCandidate;
  readonly locator: Locator;
  readonly context: Page | Frame;
  readonly candidate: AdaptiveCandidateScore;
  readonly key: string;
};

export type LegacySeededAdaptiveDiscoveryOptions = {
  readonly maxSeeds?: number;
  readonly maxClicks?: number;
  readonly settleMs?: number;
};

export type LegacySeededAdaptiveDiscoveryRun = {
  readonly model: 'LEGACY_SEEDED_ADAPTIVE';
  readonly legacy: ChatDiscoveryReport;
  readonly seedsConsidered: number;
  readonly clicksAttempted: number;
  readonly experiments: readonly DiscoveryExperimentResult[];
  readonly selected?: DiscoveryExperimentResult;
  readonly debug: readonly AdaptiveDiscoveryDebugAttempt[];
};

const DEFAULT_MAX_SEEDS = 40;
const DEFAULT_MAX_CLICKS = 12;
const DEFAULT_SETTLE_MS = 350;

/**
 * Independent third discovery model.
 *
 * It does not modify LEGACY or ADAPTIVE. LEGACY supplies observed candidate
 * evidence; this model converts that evidence into Adaptive scores, reloads
 * the original page, and safely explores the Legacy-derived candidates in
 * Adaptive score order.
 */
export class LegacySeededAdaptiveDiscovery {
  public constructor(private readonly page: Page, private readonly options: LegacySeededAdaptiveDiscoveryOptions = {}) {}

  public async run(): Promise<LegacySeededAdaptiveDiscoveryRun> {
    const debug: AdaptiveDiscoveryDebugAttempt[] = [];
    const targetUrl = this.page.url();
    const legacy = await this.discoverLegacy(debug);
    await this.restore(targetUrl, debug);

    const seeds = await this.collectLegacySeeds(legacy, debug);
    const experiments: DiscoveryExperimentResult[] = [];
    let clicksAttempted = 0;
    const maxClicks = this.options.maxClicks ?? DEFAULT_MAX_CLICKS;

    for (const seed of seeds) {
      if (clicksAttempted >= maxClicks) break;
      const before = await this.snapshot(debug, 'SNAPSHOT_BEFORE');
      const beforeUrl = this.page.url();
      const clickOk = await this.safeClick(seed, debug);
      if (!clickOk) continue;
      clicksAttempted += 1;
      await this.page.waitForTimeout(this.options.settleMs ?? DEFAULT_SETTLE_MS);
      const after = await this.snapshot(debug, 'SNAPSHOT_AFTER');
      const diff = diffUiSnapshots(before, after);
      const result: DiscoveryExperimentResult = {
        candidate: seed.candidate,
        before,
        after,
        diff,
        classification: classifyExperiment(diff),
      };
      experiments.push(result);
      if (result.classification === 'CHAT_SURFACE_CANDIDATE') {
        return { model: 'LEGACY_SEEDED_ADAPTIVE', legacy, seedsConsidered: seeds.length, clicksAttempted, experiments, selected: result, debug };
      }
      await this.restore(beforeUrl, debug);
    }

    return { model: 'LEGACY_SEEDED_ADAPTIVE', legacy, seedsConsidered: seeds.length, clicksAttempted, experiments, debug };
  }

  private async discoverLegacy(debug: AdaptiveDiscoveryDebugAttempt[]): Promise<ChatDiscoveryReport> {
    try {
      const result = await new PlaywrightChatDiscovery(this.page).discoverWithEvidence();
      return result.report;
    } catch (error) {
      if (error instanceof ChatDiscoveryError && error.report) return error.report;
      debug.push({ candidateId: 'legacy', score: 0, frameUrl: this.page.url(), stage: 'COLLECT', action: 'INSPECT', ok: false, error: this.errorMessage(error) });
      throw error;
    }
  }

  private async collectLegacySeeds(report: ChatDiscoveryReport, debug: AdaptiveDiscoveryDebugAttempt[]): Promise<SeedHandle[]> {
    const handles: SeedHandle[] = [];
    const seen = new Set<string>();
    const maxSeeds = this.options.maxSeeds ?? DEFAULT_MAX_SEEDS;
    const matched = report.candidates.filter((candidate) => candidate.matched && candidate.element && candidate.role === 'launcher');

    for (const source of matched) {
      const element = source.element;
      if (!element) continue;
      const contexts: Array<Page | Frame> = [this.page, ...this.page.frames().filter((frame) => frame !== this.page.mainFrame())];
      for (const context of contexts) {
        if (element.frameUrl && context.url() !== element.frameUrl) continue;
        const locator = this.locatorForEvidence(context, element);
        if (!locator) continue;
        const candidate = await this.buildCandidate(locator);
        if (!candidate) continue;
        const key = this.candidateKey(candidate);
        if (seen.has(key)) continue;
        seen.add(key);
        const scored = scoreDiscoveryCandidate(candidate);
        handles.push({ source, locator, context, candidate: scored, key });
        debug.push({ candidateId: scored.candidateId, score: scored.score, frameUrl: context.url(), stage: 'COLLECT', action: 'INSPECT', ok: true });
        break;
      }
      if (handles.length >= maxSeeds) break;
    }

    return handles.sort((left, right) => right.candidate.score - left.candidate.score || left.key.localeCompare(right.key)).slice(0, maxSeeds);
  }

  private locatorForEvidence(context: Page | Frame, evidence: NonNullable<ChatDiscoveryCandidate['element']>): Locator | null {
    if (evidence.testId) return context.locator(`[data-testid=${this.cssString(evidence.testId)}]`).first();
    if (evidence.ariaLabel) return context.locator(`${evidence.tagName}[aria-label=${this.cssString(evidence.ariaLabel)}], [role=${this.cssString(evidence.role ?? '')}][aria-label=${this.cssString(evidence.ariaLabel)}]`).first();
    if (evidence.role) return context.locator(`${evidence.tagName}[role=${this.cssString(evidence.role)}]`).filter({ hasText: evidence.text ?? '' }).first();
    if (evidence.text) return context.locator(evidence.tagName).filter({ hasText: evidence.text }).first();
    return context.locator(evidence.tagName).first();
  }

  private async buildCandidate(locator: Locator): Promise<DiscoveryCandidate | null> {
    if (!await locator.isVisible().catch(() => false)) return null;
    if (!await locator.isEnabled().catch(() => false)) return null;
    const box = await locator.boundingBox().catch(() => null);
    if (!box) return null;
    const tagName = await locator.evaluate((element) => element.tagName.toLowerCase()).catch(() => 'unknown');
    const role = await locator.getAttribute('role').catch(() => null) ?? (tagName === 'button' ? 'button' : undefined);
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
    const fixed = await locator.evaluate((element) => getComputedStyle(element).position === 'fixed').catch(() => false);
    const viewport = this.page.viewportSize();
    return {
      id: `${tagName}:${ariaLabel ?? text}:${Math.round(box.x)}:${Math.round(box.y)}`,
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
      ...(ariaExpanded !== null ? { ariaExpanded } : {}),
      ...(navigationSignal ? { navigationSignal } : {}),
      fixed,
      ...(viewport ? { bottomDistance: Math.max(0, viewport.height - (box.y + box.height)), rightDistance: Math.max(0, viewport.width - (box.x + box.width)) } : {}),
    };
  }

  private candidateKey(candidate: DiscoveryCandidate): string {
    return `${candidate.tagName}|${candidate.role ?? ''}|${candidate.ariaLabel ?? ''}|${candidate.text ?? ''}|${candidate.testId ?? ''}|${candidate.href ?? ''}`;
  }

  private async safeClick(seed: SeedHandle, debug: AdaptiveDiscoveryDebugAttempt[]): Promise<boolean> {
    try {
      await seed.locator.scrollIntoViewIfNeeded({ timeout: 1_500 });
      await seed.locator.click({ timeout: 3_000, noWaitAfter: true });
      debug.push({ candidateId: seed.candidate.candidateId, score: seed.candidate.score, frameUrl: seed.context.url(), stage: 'CLICK', action: 'CLICK', ok: true });
      return true;
    } catch (error) {
      debug.push({ candidateId: seed.candidate.candidateId, score: seed.candidate.score, frameUrl: seed.context.url(), stage: 'CLICK', action: 'CLICK', ok: false, error: this.errorMessage(error) });
      return false;
    }
  }

  private async restore(url: string, debug: AdaptiveDiscoveryDebugAttempt[]): Promise<void> {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8_000 });
    } catch (error) {
      debug.push({ candidateId: 'restore', score: 0, frameUrl: this.page.url(), stage: 'RESTORE', action: 'RESTORE', ok: false, error: this.errorMessage(error) });
    }
  }

  private async snapshot(debug: AdaptiveDiscoveryDebugAttempt[], stage: 'SNAPSHOT_BEFORE' | 'SNAPSHOT_AFTER'): Promise<UiSnapshot> {
    const contexts: Array<Page | Frame> = [this.page, ...this.page.frames().filter((frame) => frame !== this.page.mainFrame())];
    const parts: string[] = [];
    let visibleElementCount = 0; let dialogCount = 0; let textboxCount = 0; let formCount = 0; let iframeCount = 0;
    for (const context of contexts) {
      try {
        const html = await context.locator('html').evaluate((element) => element.outerHTML);
        parts.push(`${context.url()}|${html}`);
        const counts = await context.locator('body').evaluate((body) => {
          const elements = Array.from(body.querySelectorAll('*'));
          let visibleElementCount = 0; let dialogCount = 0; let textboxCount = 0; let formCount = 0; let iframeCount = 0;
          for (const element of elements) {
            const style = window.getComputedStyle(element); const rect = element.getBoundingClientRect();
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
        visibleElementCount += counts.visibleElementCount; dialogCount += counts.dialogCount; textboxCount += counts.textboxCount; formCount += counts.formCount; iframeCount += counts.iframeCount;
      } catch (error) {
        debug.push({ candidateId: `context:${context.url()}`, score: 0, frameUrl: context.url(), stage, action: 'INSPECT', ok: false, error: this.errorMessage(error) });
      }
    }
    return { domHash: createHash('sha256').update(parts.join('\n')).digest('hex'), visibleElementCount, dialogCount, textboxCount, formCount, iframeCount };
  }

  private cssString(value: string): string { return JSON.stringify(value); }
  private errorMessage(error: unknown): string { return error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
}
