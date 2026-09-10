# Adaptive discovery benchmark

## Objective

Run the existing heuristic discovery (`LEGACY`) and the new evidence-driven discovery (`ADAPTIVE`) against the same public SUT corpus without disabling or replacing the existing model.

The benchmark measures whether adaptive discovery improves discovery coverage while preserving the existing model as a control. Functional interaction is measured as a separate downstream stage.

## Experimental design

For every target:

1. Create a fresh Playwright browser context.
2. Navigate to the target URL and run LEGACY discovery.
3. Close the context completely.
4. Create a second fresh context, navigate to the same target URL and run ADAPTIVE discovery.
5. Persist both observations in one versioned benchmark report.
6. In a separate Adaptive interaction benchmark, targets where Adaptive finds a chat-like surface are probed with a non-destructive message.

Fresh contexts are the controlled reset mechanism. The models never share a selected locator, page state or browser storage from the other run.

The discovery benchmark measures discovery only. `CHAT_SURFACE_FOUND` means that the discovery model identified a chat-like surface; it does not mean that SEND → RECEIVE was proven. Functional verification is performed by `browser:discovery:interaction` and recorded separately as `VERIFIED` or `FAILED`.

## Running the benchmark

Use the maintained public corpus by default:

```bash
npm run browser:discovery:benchmark
```

Run the Adaptive functional interaction stage:

```bash
npm run browser:discovery:interaction
```

Optional configuration:

```bash
DISCOVERY_BENCHMARK_CORPUS_FILE=examples/public-sut-discovery-corpus.json \
DISCOVERY_BENCHMARK_OUTPUT_FILE=artifacts/browser-sut/adaptive-discovery-benchmark.json \
DISCOVERY_BENCHMARK_TIMEOUT_MS=30000 \
ADAPTIVE_DISCOVERY_MAX_CANDIDATES=40 \
ADAPTIVE_DISCOVERY_MAX_CLICKS=12 \
ADAPTIVE_DISCOVERY_THRESHOLD=35 \
npm run browser:discovery:benchmark
```

For functional evidence:

```bash
ADAPTIVE_PROBE_MESSAGE=Hello \
ADAPTIVE_INTERACTION_TIMEOUT_MS=15000 \
npm run browser:discovery:interaction
```

The interaction stage writes `adaptive-interaction-benchmark.json` and, for selected targets, screenshots under `artifacts/browser-sut/adaptive-interaction/<targetId>/`.

## Primary metrics

- **Discovery rate** = targets where a chat surface is identified / total targets.
- **Verification rate** = targets with a verified SEND → RECEIVE conversation / total targets.
- **Functional success rate after discovery** = verified interactions / Adaptive chat-surface selections.
- **False-positive rate** = selected chat-surface candidates that fail functional validation / selected candidates.
- **Candidate efficiency** = experiments performed before the first high-confidence chat candidate.
- **Coverage delta** = adaptive discovery rate minus legacy discovery rate.
- **Verification delta** = adaptive verification rate minus legacy verification rate when an equivalent functional probe exists.

The discovery report does not synthesize verification. Functional evidence comes from the downstream interaction stage.

## Precision definition

For launcher discovery, precision is:

`true-positive launcher selections / all launcher selections presented as high-confidence`

A selection is a true positive only when the downstream functional probe establishes that it opens the intended conversation surface. Mere DOM similarity is not sufficient.

## Initial success criteria

This phase is exploratory. No threshold is treated as a product guarantee until the corpus has enough observations. The first useful baseline should contain at least 20 targets and include positive, negative and ambiguous widget patterns.

The adaptive model is considered promising when it improves verified-conversation coverage without materially increasing false positives or unsafe interaction attempts.

## Safety constraints

- Never activate destructive, purchase, logout, delete or irreversible controls during discovery.
- Bound the number of exploratory interactions per page.
- Use only a non-destructive probe message during the public interaction stage.
- Preserve the existing legacy path unchanged.
- Store screenshots and machine-readable evidence for successful or attempted interaction targets so failures remain diagnosable.
