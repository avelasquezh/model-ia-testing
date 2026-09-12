import type { AdaptiveCandidateScore } from './AdaptiveDiscovery.js';

export type UiSnapshot = {
  readonly domHash: string;
  readonly visibleElementCount: number;
  readonly dialogCount: number;
  readonly textboxCount: number;
  readonly formCount: number;
  readonly iframeCount: number;
  readonly contentEditableCount: number;
  readonly liveRegionCount: number;
  readonly messageNodeCount: number;
  readonly chatSignalCount: number;
  readonly shadowRootCount: number;
};

export type UiSnapshotDiff = {
  readonly newVisibleElements: number;
  readonly newDialogs: number;
  readonly newTextboxes: number;
  readonly newForms: number;
  readonly newIframes: number;
  readonly newContentEditables: number;
  readonly newLiveRegions: number;
  readonly newMessageNodes: number;
  readonly newChatSignals: number;
  readonly newShadowRoots: number;
  readonly domChanged: boolean;
};

export type DiscoveryExperimentResult = {
  readonly candidate: AdaptiveCandidateScore;
  readonly before: UiSnapshot;
  readonly after: UiSnapshot;
  readonly diff: UiSnapshotDiff;
  readonly classification: 'NO_SIGNAL' | 'INTERESTING' | 'CHAT_SURFACE_CANDIDATE';
  readonly surfaceScore?: number;
  readonly surfaceEvidence?: readonly string[];
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
    newContentEditables: Math.max(0, after.contentEditableCount - before.contentEditableCount),
    newLiveRegions: Math.max(0, after.liveRegionCount - before.liveRegionCount),
    newMessageNodes: Math.max(0, after.messageNodeCount - before.messageNodeCount),
    newChatSignals: Math.max(0, after.chatSignalCount - before.chatSignalCount),
    newShadowRoots: Math.max(0, after.shadowRootCount - before.shadowRootCount),
    domChanged: before.domHash !== after.domHash,
  };
}

export function classifyExperiment(diff: UiSnapshotDiff): DiscoveryExperimentResult['classification'] {
  const surfaceScore =
    diff.newTextboxes * 12 +
    diff.newDialogs * 10 +
    diff.newIframes * 8 +
    diff.newForms * 6 +
    diff.newContentEditables * 12 +
    diff.newLiveRegions * 7 +
    diff.newMessageNodes * 7 +
    diff.newChatSignals * 10 +
    diff.newShadowRoots * 2;

  if (surfaceScore >= 12 && (diff.newTextboxes > 0 || diff.newContentEditables > 0) &&
      (diff.newDialogs > 0 || diff.newIframes > 0 || diff.newForms > 0 || diff.newChatSignals > 0 || diff.newLiveRegions > 0)) {
    return 'CHAT_SURFACE_CANDIDATE';
  }
  if (surfaceScore > 0 || diff.domChanged || diff.newVisibleElements > 0) {
    return 'INTERESTING';
  }
  return 'NO_SIGNAL';
}
