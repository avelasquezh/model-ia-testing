# Adaptive discovery benchmark

## Objective

Run the existing heuristic discovery (`LEGACY`) and the new evidence-driven discovery (`ADAPTIVE`) against the same public SUT corpus without disabling or replacing the existing model.

The benchmark measures whether adaptive discovery improves discovery and verified-conversation rates while preserving the existing model as a control.

## Experimental design

For every target:

1. Create a fresh Playwright browser context.
2. Navigate to the target URL and run LEGACY discovery.
3. Close the context completely.
4. Create a second fresh context, navigate to the same target URL and run ADAPTIVE discovery.
5. Persist both observations in one versioned benchmark report.

Fresh contexts are the controlled reset mechanism. The models never share a selected locator, page state or browser storage from the other run.

The current orchestrator measures **discovery only**. `CHAT_SURFACE_FOUND` means that the discovery model identified a chat-like surface; it does not mean that SEND → RECEIVE was proven. Functional verification remains a separate authority and is explicitly marked `NOT_PERFORMED` by the benchmark CLI.

## Running the benchmark

Use the maintained public corpus by default:

```bash
npm run browser:discovery:benchmark
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

The report contains one observation per model and target, adaptive experiment evidence where applicable, a comparison summary and an explicit error list. External SUTs can change or block automation, so a failed target is evidence about that runtime condition rather than automatic proof that the model is wrong.

## Primary metrics

- **Discovery rate** = targets where a chat surface is identified / total targets.
- **Verification rate** = targets with a verified SEND → RECEIVE conversation / total targets.
- **False-positive rate** = selected launcher candidates that fail functional validation / selected launcher candidates.
- **Candidate efficiency** = experiments performed before the first high-confidence chat candidate.
- **Coverage delta** = adaptive discovery rate minus legacy discovery rate.
- **Verification delta** = adaptive verification rate minus legacy verification rate.

The current discovery-only report can calculate discovery and efficiency metrics. Verification and precision must be calculated only after a downstream functional probe supplies the ground-truth outcome.

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
- Preserve the existing legacy path unchanged.
- Store evidence for every adaptive experiment so failures are diagnosable and reproducible.
