import type { AdaptiveCandidateScore } from './AdaptiveDiscovery.js';

export type UiSnapshot = {
  readonly domHash: string;
  readonly visibleElementCount: number;
  readonly dialogCount: number;
  readonly textboxCount: number;
  readonly formCount: number;
  readonly iframeCount: number;
};

export type UiSnapshotDiff = {
  readonly newVisibleElements: number;
  readonly newDialogs: number;
  readonly newTextboxes: number;
  readonly newForms: number;
  readonly newIframes: number;
  readonly domChanged: boolean;
};

export type DiscoveryExperimentResult = {
  readonly candidate: AdaptiveCandidateScore;
  readonly before: UiSnapshot;
  readonly after: UiSnapshot;
  readonly diff: UiSnapshotDiff;
  readonly classification: 'NO_SIGNAL' | 'INTERESTING' | 'CHAT_SURFACE_CANDIDATE';
};

export type AdaptiveDiscoveryDebugAttempt = {
  readonly candidateId: string;
  readonly score: number;
  readonly frameUrl: string;
  readonly stage: 'COLLECT' | 'SNAPSHOT_BEFORE' | 'CLICK' | 'SNAPSHOT_AFTER' | 'RESTORE';
  readonly action: 'INSPECT' | 'CLICK' | 'CLICK_FORCE' | 'RESTORE';
  readonly ok: boolean;
  readonly error?: string;
};

export function diffUiSnapshots(before: UiSnapshot, after: UiSnapshot): UiSnapshotDiff {
  return {
    newVisibleElements: Math.max(0, after.visibleElementCount - before.visibleElementCount),
    newDialogs: Math.max(0, after.dialogCount - before.dialogCount),
    newTextboxes: Math.max(0, after.textboxCount - before.textboxCount),
    newForms: Math.max(0, after.formCount - before.formCount),
    newIframes: Math.max(0, after.iframeCount - before.iframeCount),
    domChanged: before.domHash !== after.domHash,
  };
}

export function classifyExperiment(diff: UiSnapshotDiff): DiscoveryExperimentResult['classification'] {
  if (diff.newTextboxes > 0 && (diff.newDialogs > 0 || diff.newIframes > 0 || diff.newForms > 0)) {
    return 'CHAT_SURFACE_CANDIDATE';
  }
  if (diff.domChanged || diff.newVisibleElements > 0 || diff.newDialogs > 0 || diff.newTextboxes > 0) {
    return 'INTERESTING';
  }
  return 'NO_SIGNAL';
}
