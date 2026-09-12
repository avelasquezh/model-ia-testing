import { createHash } from 'node:crypto';
import type { Frame, Locator, Page } from '@playwright/test';
import { scoreDiscoveryCandidate, type AdaptiveCandidateScore, type DiscoveryCandidate } from './AdaptiveDiscovery.js';
import { classifyExperiment, diffUiSnapshots, type AdaptiveDiscoveryDebugAttempt, type DiscoveryExperimentResult, type UiSnapshot } from './AdaptiveDiscoveryExperiment.js';

const DEFAULT_MAX_CANDIDATES = 80;
const DEFAULT_MAX_CLICKS = 24;
const DEFAULT_SETTLE_MS = 650;

export type AdaptiveDiscoveryRunnerOptions = {
  readonly maxCandidates?: number;
  readonly maxClicks?: number;
  readonly settleMs?: number;
  readonly highConfidenceThreshold?: number;
  readonly isolateExperiments?: boolean;
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
const EXPLORATION_SELECTOR = [
  'button',
  '[role="button"]',
  '[tabindex="0"]',
  '[onclick]',
  'a[href]',
  '[aria-controls]',
  '[aria-expanded]',
  '[aria-haspopup]',
  '[data-testid]',
  '[data-chat]',
  '[data-widget]',
  '[id*="chat" i]',
  '[class*="chat" i]',
  '[title*="chat" i]',
  '[aria-label*="chat" i]',
  '[aria-label*="help" i]',
  '[aria-label*="contact" i]',
].join(',');

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
      const classification = classifyExperiment(diff);
      const result: DiscoveryExperimentResult = {
        candidate: handle.candidate,
        before,
        after,
        diff,
        classification,
        surfaceScore: this.surfaceScore(diff),
        surfaceEvidence: this.surfaceEvidence(diff),
      };
      experiments.push(result);
      if (classification === 'CHAT_SURFACE_CANDIDATE') return { experiments, selected: result, candidatesConsidered: candidates.length, clicksAttempted, debug };

      if (this.options.isolateExperiments ?? true) {
        await this.restoreAfterExperiment(beforeUrl, handle, debug);
      }
    }
    return { experiments, candidatesConsidered: candidates.length, clicksAttempted, debug };
  }

  private async collectCandidates(debug: AdaptiveDiscoveryDebugAttempt[]): Promise<CandidateHandle[]> {
    const handles: CandidateHandle[] = [];
    const seen = new Set<string>();
    const contexts: Array<Page | Frame> = [this.page, ...this.page.frames().filter((frame) => frame !== this.page.mainFrame())];
    const maxCandidates = this.options.maxCandidates ?? DEFAULT_MAX_CANDIDATES;

    for (const context of contexts) {
      const locator = context.locator(EXPLORATION_SELECTOR);
      let count = 0;
      try {
        count = await locator.count();
      } catch (error) {
        debug.push({ candidateId: `context:${context.url()}`, score: 0, frameUrl: context.url(), stage: 'COLLECT', action: 'INSPECT', ok: false, error: this.errorMessage(error) });
        continue;
      }

      const limit = Math.min(count, Math.max(maxCandidates * 4, 160));
      for (let index = 0; index < limit; index += 1) {
        const candidateLocator = locator.nth(index);
        if (!await this.isSafeCandidate(candidateLocator)) continue;
        const candidate = await this.buildCandidate(candidateLocator);
        if (!candidate) continue;
        const exploratorySignal = candidate.tagName === 'a' || candidate.tagName === 'button' || candidate.role === 'button' ||
          Boolean(candidate.ariaControls) || candidate.ariaExpanded !== undefined || Boolean(candidate.ariaHasPopup) ||
          Boolean(candidate.dataChatSignal) || Boolean(candidate.navigationSignal) || Boolean(candidate.shadowHost);
        if (!exploratorySignal) continue;
        const key = this.candidateKey(candidate);
        if (seen.has(key)) continue;
        seen.add(key);
        const scored = scoreDiscoveryCandidate(candidate);
        handles.push({ locator: candidateLocator, context, candidate: scored, key });
        debug.push({ candidateId: scored.candidateId, score: scored.score, frameUrl: context.url(), stage: 'COLLECT', action: 'INSPECT', ok: true });
      }
    }

    return this.rankCandidates(handles).slice(0, maxCandidates);
  }

  private rankCandidates(handles: CandidateHandle[]): CandidateHandle[] {
    return [...handles].sort((left, right) => {
      if (right.candidate.score !== left.candidate.score) return right.candidate.score - left.candidate.score;
      if (right.candidate.confidenceScore !== left.candidate.confidenceScore) return right.candidate.confidenceScore - left.candidate.confidenceScore;
      return left.key.localeCompare(right.key);
    });
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
    const ariaHasPopup = await locator.getAttribute('aria-haspopup').catch(() => null) ?? undefined;
    const ariaLive = await locator.getAttribute('aria-live').catch(() => null) ?? undefined;
    const dataChatSignal = await locator.evaluate((element) => {
      const values: string[] = [];
      for (const attribute of Array.from(element.attributes)) {
        if (/^data-/i.test(attribute.name) && /chat|livechat|chatbox|messenger|assistant|support|help|contact|customer|servicio|ayuda|asistente/i.test(attribute.value)) {
          values.push(`${attribute.name}=${attribute.value}`);
        }
      }
      return values.join(' ').slice(0, 240);
    }).catch(() => '');
    const navigationSignal = await locator.evaluate((element) => ['onclick', 'onmousedown', 'onmouseup', 'ontouchstart', 'onkeydown'].some((name) => element.hasAttribute(name))).catch(() => false);
    const shadowHost = await locator.evaluate((element) => element.shadowRoot !== null).catch(() => false);
    const readonly = (await locator.getAttribute('readonly')) !== null;
    const disabled = (await locator.getAttribute('disabled')) !== null;
    const viewport = this.page.viewportSize();
    const fixed = await locator.evaluate((element) => getComputedStyle(element).position === 'fixed').catch(() => false);
    const zIndex = await locator.evaluate((element) => Number.parseInt(getComputedStyle(element).zIndex, 10)).catch(() => Number.NaN);

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
      ...(ariaHasPopup ? { ariaHasPopup } : {}),
      ...(ariaLive ? { ariaLive } : {}),
      ...(dataChatSignal ? { dataChatSignal } : {}),
      ...(navigationSignal ? { navigationSignal } : {}),
      ...(shadowHost ? { shadowHost } : {}),
      readonly,
      disabled,
      fixed,
      ...(Number.isFinite(zIndex) ? { zIndex } : {}),
      ...(viewport ? {
        bottomDistance: Math.max(0, viewport.height - (box.y + box.height)),
        rightDistance: Math.max(0, viewport.width - (box.x + box.width)),
      } : {}),
      width: box.width,
      height: box.height,
    };
  }

  private candidateKey(candidate: DiscoveryCandidate): string {
    return [
      candidate.tagName, candidate.role ?? '', candidate.ariaLabel ?? '', candidate.text ?? '', candidate.href ?? '',
      candidate.title ?? '', candidate.name ?? '', candidate.testId ?? '', candidate.ariaControls ?? '',
      candidate.ariaExpanded ?? '', candidate.ariaHasPopup ?? '', candidate.dataChatSignal ?? '',
      candidate.navigationSignal ?? false, candidate.shadowHost ?? false, candidate.id,
    ].join('|');
  }

  private async safeClick(handle: CandidateHandle, debug: AdaptiveDiscoveryDebugAttempt[]): Promise<{ ok: boolean }> {
    const frameUrl = handle.context.url();
    const candidateId = handle.candidate.candidateId;
    try {
      await handle.locator.scrollIntoViewIfNeeded({ timeout: 2_000 });
      await handle.locator.click({ timeout: 4_000 });
      debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK', ok: true });
      return { ok: true };
    } catch (firstError) {
      debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK', ok: false, error: this.errorMessage(firstError) });
      try {
        await handle.locator.scrollIntoViewIfNeeded({ timeout: 1_500 });
        await handle.locator.click({ timeout: 3_000, force: true });
        debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK_FORCE', ok: true });
        return { ok: true };
      } catch (forceError) {
        debug.push({ candidateId, score: handle.candidate.score, frameUrl, stage: 'CLICK', action: 'CLICK_FORCE', ok: false, error: this.errorMessage(forceError) });
        return { ok: false };
      }
    }
  }

  private async restoreAfterExperiment(beforeUrl: string, handle: CandidateHandle, debug: AdaptiveDiscoveryDebugAttempt[]): Promise<void> {
    if (beforeUrl === 'about:blank') return;
    try {
      debug.push({ candidateId: handle.candidate.candidateId, score: handle.candidate.score, frameUrl: handle.context.url(), stage: 'RESTORE', action: 'RESTORE', ok: true });
      if (this.page.url() !== beforeUrl) {
        await this.page.goto(beforeUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      } else {
        await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 10_000 });
      }
    } catch (error) {
      debug.push({ candidateId: handle.candidate.candidateId, score: handle.candidate.score, frameUrl: handle.context.url(), stage: 'RESTORE', action: 'RESTORE', ok: false, error: this.errorMessage(error) });
    }
  }

  public async snapshot(debug: AdaptiveDiscoveryDebugAttempt[], stage: 'SNAPSHOT_BEFORE' | 'SNAPSHOT_AFTER'): Promise<UiSnapshot> {
    const contexts: Array<Page | Frame> = [this.page, ...this.page.frames().filter((frame) => frame !== this.page.mainFrame())];
    const parts: string[] = [];
    let visibleElementCount = 0;
    let dialogCount = 0;
    let textboxCount = 0;
    let formCount = 0;
    let iframeCount = 0;
    let contentEditableCount = 0;
    let liveRegionCount = 0;
    let messageNodeCount = 0;
    let chatSignalCount = 0;
    let shadowRootCount = 0;

    for (const context of contexts) {
      try {
        const snapshot = await context.locator('html').evaluate((element) => {
          const dynamicAttributes = new Set(['id', 'class', 'style', 'data-reactroot', 'data-testid']);
          const chatPattern = /chat|livechat|chatbox|messenger|assistant|support|help|contact|customer|servicio|ayuda|asistente/i;
          const messagePattern = /message|mensaje|response|respuesta|conversation|conversacion|chat/i;
          let visibleElementCount = 0;
          let dialogCount = 0;
          let textboxCount = 0;
          let formCount = 0;
          let iframeCount = 0;
          let contentEditableCount = 0;
          let liveRegionCount = 0;
          let messageNodeCount = 0;
          let chatSignalCount = 0;
          let shadowRootCount = 0;
          const shadowSerializations: string[] = [];

          const visit = (root: ParentNode): void => {
            for (const child of Array.from(root.children)) {
              const node = child as HTMLElement;
              const style = window.getComputedStyle(node);
              const rect = node.getBoundingClientRect();
              const visible = style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
              if (visible) {
                visibleElementCount += 1;
                if (node.matches('[role="dialog"], dialog')) dialogCount += 1;
                if (node.matches('textarea, input:not([type="hidden"]), [contenteditable="true"], [role="textbox"]')) textboxCount += 1;
                if (node.matches('form')) formCount += 1;
                if (node.matches('iframe')) iframeCount += 1;
                if (node.matches('[contenteditable="true"]')) contentEditableCount += 1;
                if (node.matches('[aria-live], [role="log"], [role="status"], [role="alert"]')) liveRegionCount += 1;
                const semantic = `${node.getAttribute('aria-label') ?? ''} ${node.getAttribute('title') ?? ''} ${node.getAttribute('data-testid') ?? ''} ${node.className ?? ''} ${node.id ?? ''}`;
                if (messagePattern.test(semantic)) messageNodeCount += 1;
                if (chatPattern.test(semantic)) chatSignalCount += 1;
              }
              if (node.shadowRoot) {
                shadowRootCount += 1;
                shadowSerializations.push(node.shadowRoot.innerHTML.slice(0, 50_000));
                visit(node.shadowRoot);
              }
              visit(node);
            }
          };

          visit(element);
          const clone = element.cloneNode(true) as HTMLElement;
          const nodes = clone.querySelectorAll('[id], [class], [style], [data-reactroot], [data-testid]');
          for (const node of Array.from(nodes)) {
            for (const attribute of dynamicAttributes) node.removeAttribute(attribute);
          }
          return {
            html: clone.outerHTML,
            shadowSerializations,
            visibleElementCount,
            dialogCount,
            textboxCount,
            formCount,
            iframeCount,
            contentEditableCount,
            liveRegionCount,
            messageNodeCount,
            chatSignalCount,
            shadowRootCount,
          };
        });

        parts.push(`${context.url()}|${snapshot.html}|${snapshot.shadowSerializations.join('|')}`);
        visibleElementCount += snapshot.visibleElementCount;
        dialogCount += snapshot.dialogCount;
        textboxCount += snapshot.textboxCount;
        formCount += snapshot.formCount;
        iframeCount += snapshot.iframeCount;
        contentEditableCount += snapshot.contentEditableCount;
        liveRegionCount += snapshot.liveRegionCount;
        messageNodeCount += snapshot.messageNodeCount;
        chatSignalCount += snapshot.chatSignalCount;
        shadowRootCount += snapshot.shadowRootCount;
      } catch (error) {
        debug.push({ candidateId: `context:${context.url()}`, score: 0, frameUrl: context.url(), stage, action: 'INSPECT', ok: false, error: this.errorMessage(error) });
      }
    }

    return {
      domHash: createHash('sha256').update(parts.join('\n')).digest('hex'),
      visibleElementCount,
      dialogCount,
      textboxCount,
      formCount,
      iframeCount,
      contentEditableCount,
      liveRegionCount,
      messageNodeCount,
      chatSignalCount,
      shadowRootCount,
    };
  }

  private surfaceScore(diff: ReturnType<typeof diffUiSnapshots>): number {
    return diff.newTextboxes * 12 + diff.newDialogs * 10 + diff.newIframes * 8 + diff.newForms * 6 +
      diff.newContentEditables * 12 + diff.newLiveRegions * 7 + diff.newMessageNodes * 7 +
      diff.newChatSignals * 10 + diff.newShadowRoots * 2;
  }

  private surfaceEvidence(diff: ReturnType<typeof diffUiSnapshots>): string[] {
    const evidence: string[] = [];
    if (diff.newTextboxes > 0) evidence.push('new-textbox');
    if (diff.newContentEditables > 0) evidence.push('new-contenteditable');
    if (diff.newDialogs > 0) evidence.push('new-dialog');
    if (diff.newIframes > 0) evidence.push('new-iframe');
    if (diff.newForms > 0) evidence.push('new-form');
    if (diff.newLiveRegions > 0) evidence.push('new-live-region');
    if (diff.newMessageNodes > 0) evidence.push('new-message-node');
    if (diff.newChatSignals > 0) evidence.push('new-chat-signal');
    if (diff.newShadowRoots > 0) evidence.push('new-shadow-root');
    if (diff.domChanged) evidence.push('dom-changed');
    return evidence;
  }

  private errorMessage(error: unknown): string { return error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
}
