# Adaptive discovery benchmark

## Objective

Evolve the discovery experiment toward a single evidence-driven engine that preserves the proven `LEGACY` heuristics as a control and incorporates their useful traversal signals into the adaptive candidate pipeline.

The QA phase deliberately separates discovery evidence from functional conversation verification. A failure in SEND → RECEIVE must not erase the value of having correctly located a chat surface.

## Experimental design

For every target, use a fresh Playwright browser context for every stage:

1. Run `LEGACY` discovery as the baseline. Legacy may traverse launcher/widget layers, but it never sends a message in this benchmark.
2. Run `DOM_INVENTORY` with zero exploratory clicks. Measure whether the unified/adaptive candidate extractor can enumerate safe candidates and produce evidence.
3. Run `SAFE_PROBE_1` with at most one safe exploratory click. Measure whether a single high-value candidate produces UI evidence.
4. Run `SAFE_EXPLORATION_3` with at most three safe exploratory clicks. Measure incremental discovery without entering the functional conversation path.
5. Run `SAFE_EXPLORATION_12` with the existing bounded exploratory budget. Stop as soon as a chat-like surface is identified.

Each stage is isolated in a new browser context. No locator, DOM state, storage, cookies or selected candidate is reused between stages.

The staged benchmark is discovery-only. It does **not** type into a composer and does **not** execute SEND or RECEIVE. `CHAT_SURFACE_FOUND` is therefore a valid discovery result even when later functional verification would fail.

## Running the staged QA benchmark

```bash
npm run browser:discovery:stages
```

Optional configuration:

```bash
DISCOVERY_BENCHMARK_CORPUS_FILE=examples/public-sut-discovery-corpus.json \
DISCOVERY_STAGED_OUTPUT_FILE=artifacts/browser-sut/discovery-staged-evidence.json \
DISCOVERY_BENCHMARK_TIMEOUT_MS=30000 \
ADAPTIVE_DISCOVERY_MAX_CANDIDATES=40 \
ADAPTIVE_DISCOVERY_SETTLE_MS=350 \
npm run browser:discovery:stages
```

The staged report records candidate count, clicks attempted, experiments executed, chat-surface detection, debug-event count and stage errors independently per target.

## Evidence ladder

The QA benchmark evaluates the following progression rather than a single pass/fail result:

- **L0 — page access**: target can be loaded.
- **L1 — candidate inventory**: safe interactive candidates are enumerated.
- **L2 — candidate scoring**: semantic, structural, accessibility, geometric and behavioral evidence is accumulated.
- **L3 — safe candidate selection**: a candidate survives the safety gate and is ranked for exploration.
- **L4 — safe interaction**: a bounded click is actually attempted and recorded.
- **L5 — UI evidence**: DOM/visibility/dialog/textbox/iframe changes are detected after the click.
- **L6 — chat surface**: evidence is sufficient to classify a chat-like surface.
- **L7 — composer**: intentionally measured only by a downstream interaction stage.
- **L8 — SEND**: intentionally measured only by a downstream interaction stage.
- **L9 — RECEIVE / VERIFIED**: intentionally measured only by a downstream interaction stage.

A failure at a higher level does not invalidate evidence collected at lower levels.

## Model direction

The long-term target is `UNIFIED DISCOVERY`: one provider-neutral engine that combines the strongest parts of both approaches instead of maintaining two competing algorithms.

- `LEGACY` contributes proven context traversal, launcher/composer semantics, nested-widget handling, iframe awareness and Shadow DOM-aware discovery.
- `ADAPTIVE` contributes candidate scoring, ranking, evidence fusion, bounded experimentation and DOM-diff classification.
- Safety is an independent gate before any exploratory click.
- Functional SEND → RECEIVE verification remains a separate downstream stage.

Until the unified engine is validated, `LEGACY` remains unchanged and is treated as the control/baseline.

## Primary metrics

- **Legacy discovery rate** = Legacy chat surfaces identified / total targets.
- **Stage candidate coverage** = targets with at least one safe candidate / total targets.
- **Click execution rate** = stages with at least one successful click / stages with safe candidates.
- **Chat-surface yield** = chat surfaces identified / exploratory stages executed.
- **Candidate efficiency** = exploratory clicks before the first chat-surface classification.
- **Coverage delta** = staged/unified chat-surface coverage minus Legacy coverage.
- **Functional success after discovery** = verified interactions / chat-surface selections; measured separately.
- **False-positive rate** = chat-surface selections later rejected by functional validation; measured separately.

Performance must not be interpreted as an improvement while `clicksAttempted` remains zero: a fast no-op is not a better discovery model.

## Promotion gate: QA → main

No code is promoted to `main` merely because CI is green.

Promotion requires the staged QA benchmark to demonstrate, against the same corpus:

1. higher or equal chat-surface coverage than Legacy, with a meaningful positive delta;
2. `clicksAttempted > 0` on targets where safe candidates exist;
3. no material increase in unsafe interaction attempts;
4. no regression in the existing Legacy baseline;
5. reproducible evidence in machine-readable artifacts;
6. functional verification, when run, confirms that improved discovery does not come from false positives.

The exact promotion threshold remains empirical until the corpus grows beyond the current exploratory baseline.

## Safety constraints

- Never activate destructive, purchase, logout, delete or irreversible controls during discovery.
- Bound exploratory interactions per page.
- Never type or send a probe message during the staged discovery benchmark.
- Preserve the existing Legacy path unchanged.
- Store machine-readable evidence for successful and attempted stages so failures remain diagnosable.
