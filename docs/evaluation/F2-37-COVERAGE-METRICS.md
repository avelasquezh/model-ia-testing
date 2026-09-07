# F2-37 — Métricas descriptivas de cobertura por ejecución

## Estado

**IMPLEMENTADO; pendiente de validación CI.**

## Propósito

F2-37 cuantifica descriptivamente la cobertura de una ejecución a partir de `EvaluationCoverageInterpretation` (F2-36). No redefine la cobertura ni determina calidad, aceptación o rechazo.

## Cadena metodológica

`EvaluationSelectionContext → EvaluationPlan → EvaluationCoverage → EvaluationCoverageInterpretation → EvaluationCoverageMetrics`

Las métricas consumen únicamente las clasificaciones ya establecidas. No vuelven a inferir aplicabilidad.

## Métricas

Para cada ejecución se conservan los siguientes conteos:

- `applicableCount`: número de criterios aplicables.
- `evaluatedCount`: criterios con evaluación concluyente (`PASS` o `FAIL`).
- `notEvaluatedCount`: criterios aplicables no evaluados.
- `insufficientEvidenceCount`: criterios aplicables con evidencia insuficiente (`NOT_EVALUABLE`).
- `inconclusiveCount`: criterios aplicables con evaluación inconclusa.
- `notApplicableCount`: criterios seleccionados marcados como `NOT_APPLICABLE`.

La distribución de criterios aplicables debe satisfacer:

`evaluatedCount + notEvaluatedCount + insufficientEvidenceCount + inconclusiveCount = applicableCount`

## Ratios descriptivos

Los ratios usan exclusivamente `applicableCount` como denominador.

`evaluatedCoverageRatio = evaluatedCount / applicableCount`

`incompleteCoverageRatio = (notEvaluatedCount + insufficientEvidenceCount + inconclusiveCount) / applicableCount`

`unresolvedCoverageRatio = (insufficientEvidenceCount + inconclusiveCount) / applicableCount`

Los ratios se expresan entre `0` y `1`, no como porcentaje presentado al usuario. Cuando `applicableCount = 0`, todos los ratios son `null` para evitar interpretar una división por cero como cobertura cero.

## Invariantes

`EvaluationCoverageMetrics` rechaza:

- conteos negativos o no enteros;
- distribuciones que no representan exactamente todos los criterios aplicables;
- ratios fuera de `[0,1]`;
- ratios no nulos cuando no existen criterios aplicables;
- ratios que no coinciden con los conteos subyacentes.

## Separación de responsabilidades

F2-37 es puramente descriptivo:

`Coverage Interpretation → Coverage Metrics`

no implica:

`Coverage Metrics → Acceptance`

La decisión explícita continúa separada en F2-31/F2-32/F2-33/F2-34.

## Límites

F2-37 no introduce:

- score;
- ponderaciones;
- thresholds;
- criterios críticos;
- reglas de parada;
- aceptación o rechazo global;
- inferencia automática de aplicabilidad;
- agregación entre ejecuciones o escenarios;
- significancia estadística;
- evaluación semántica con IA.

## Salida implementada

- `src/domain/evaluation/EvaluationCoverageMetrics.ts`
- `src/domain/evaluation/EvaluationCoverageMetrics.test.ts`
- `src/application/evaluation/MeasureEvaluationCoverage.ts`
- `src/application/evaluation/MeasureEvaluationCoverage.test.ts`
- `spike/evaluation/coverage-metrics-validation.test.ts`

## Criterio de salida

F2-37 queda validado cuando CI y Architecture Spike demuestren como mínimo:

- conteo correcto de categorías de cobertura;
- cálculo de ratios sobre criterios aplicables únicamente;
- tratamiento explícito de cero criterios aplicables mediante `null`;
- rechazo de distribuciones y ratios inconsistentes;
- independencia respecto de aceptación/rechazo y scoring.

## Próximo paso

Con F2-37 validado, el siguiente incremento debe decidir si existe una necesidad metodológica real de comparar estas métricas entre ejecuciones bajo condiciones comparables. No se introduce esa agregación hasta formalizar primero sus condiciones de comparabilidad.
