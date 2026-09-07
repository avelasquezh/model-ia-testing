# F2-37 — Métricas descriptivas de cobertura por ejecución

## Estado

**CERRADO / VALIDADO.**

## Propósito

F2-37 cuantifica descriptivamente la cobertura de una ejecución a partir de `EvaluationCoverageInterpretation` (F2-36). No redefine la cobertura ni determina calidad, aceptación o rechazo.

## Cadena metodológica

`EvaluationSelectionContext → EvaluationPlan → EvaluationCoverage → EvaluationCoverageInterpretation → EvaluationCoverageMetrics`

Las métricas consumen únicamente las clasificaciones ya establecidas. No vuelven a inferir aplicabilidad.

## Métricas

Para cada ejecución se conservan `applicableCount`, `evaluatedCount`, `notEvaluatedCount`, `insufficientEvidenceCount`, `inconclusiveCount` y `notApplicableCount`.

La distribución de criterios aplicables satisface:

`evaluatedCount + notEvaluatedCount + insufficientEvidenceCount + inconclusiveCount = applicableCount`

## Ratios descriptivos

Los ratios usan exclusivamente `applicableCount` como denominador:

`evaluatedCoverageRatio = evaluatedCount / applicableCount`

`incompleteCoverageRatio = (notEvaluatedCount + insufficientEvidenceCount + inconclusiveCount) / applicableCount`

`unresolvedCoverageRatio = (insufficientEvidenceCount + inconclusiveCount) / applicableCount`

Los ratios están entre `0` y `1`. Cuando `applicableCount = 0`, son `null` para evitar convertir la ausencia de denominador en una cobertura de cero.

## Invariantes

`EvaluationCoverageMetrics` rechaza conteos negativos o no enteros, distribuciones incompletas, ratios fuera de `[0,1]`, ratios no nulos sin criterios aplicables y ratios que no coinciden con sus conteos.

## Separación de responsabilidades

F2-37 es puramente descriptivo. `Coverage Interpretation → Coverage Metrics` no implica `Coverage Metrics → Acceptance`. La decisión explícita continúa separada en F2-31/F2-32/F2-33/F2-34.

## Límites

F2-37 no introduce score, ponderaciones, thresholds, criterios críticos, reglas de parada, aceptación o rechazo global, inferencia automática de aplicabilidad, agregación entre ejecuciones o escenarios, significancia estadística ni evaluación semántica con IA.

## Salida implementada

- `src/domain/evaluation/EvaluationCoverageMetrics.ts`
- `src/domain/evaluation/EvaluationCoverageMetrics.test.ts`
- `src/application/evaluation/MeasureEvaluationCoverage.ts`
- `src/application/evaluation/MeasureEvaluationCoverage.test.ts`
- `spike/evaluation/coverage-metrics-validation.test.ts`

## Criterio de salida

La validación final quedó demostrada por CI `34143059354` y Architecture Spike `34143059356`, ambos completamente exitosos, incluyendo TypeScript, pruebas unitarias, BDD, Playwright, migraciones PostgreSQL y Quality Gate.

## Siguiente paso

F2-38 deberá formalizar primero las condiciones de comparabilidad necesarias para observar estas métricas entre ejecuciones, antes de introducir cualquier comparación o agregación.
