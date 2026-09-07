# F2-36 — Interpretación de cobertura por ejecución

## Estado

**CERRADO / VALIDADO.**

## Propósito

F2-36 interpreta el conjunto de estados de cobertura producido por F2-35 para una ejecución concreta. Su responsabilidad es explicar el grado metodológico de resolución de la cobertura, no determinar calidad, aceptación o rechazo.

## Entrada y cadena

`EvaluationSelectionContext → EvaluationPlan → EvaluationCoverage → EvaluationCoverageInterpretation`

La interpretación consume cobertura ya construida sobre el plan congelado de la ejecución. No vuelve a inferir aplicabilidad.

## Estados de interpretación

- `COVERAGE_COMPLETE`: todos los criterios aplicables terminaron con evaluación concluyente (`PASS` o `FAIL`). Puede existir `FAIL`; cobertura completa no significa aceptación.
- `COVERAGE_PARTIAL`: existe al menos un criterio aplicable evaluado y al menos un criterio aplicable no resuelto por omisión, evidencia insuficiente o resultado inconcluso.
- `COVERAGE_UNRESOLVED`: no existe ningún criterio aplicable evaluado y existe al menos un estado `INSUFFICIENT_EVIDENCE` o `INCONCLUSIVE`.
- `NO_APPLICABLE_COVERAGE`: no existe ningún criterio aplicable; todos los criterios seleccionados son `NOT_APPLICABLE`.

No son estados ordenados por severidad. El algoritmo usa condiciones mutuamente excluyentes.

## Reglas deterministas

1. Si no existen criterios aplicables → `NO_APPLICABLE_COVERAGE`.
2. Si todos los criterios aplicables están en `APPLICABLE_EVALUATED` → `COVERAGE_COMPLETE`.
3. Si existe al menos un `APPLICABLE_EVALUATED` y además existe `APPLICABLE_NOT_EVALUATED`, `INSUFFICIENT_EVIDENCE` o `INCONCLUSIVE` → `COVERAGE_PARTIAL`.
4. Si no existe `APPLICABLE_EVALUATED` y existe `INSUFFICIENT_EVIDENCE` o `INCONCLUSIVE` → `COVERAGE_UNRESOLVED`.
5. Cualquier combinación no representable por estas reglas debe rechazarse como inconsistencia metodológica.

## Invariantes

La interpretación debe conservar exactamente la clasificación de cobertura:

- un criterio solo puede aparecer una vez;
- un criterio evaluado debe ser aplicable;
- un criterio no evaluado debe ser aplicable;
- un criterio con evidencia insuficiente debe ser aplicable;
- un criterio inconcluso debe ser aplicable;
- un criterio no aplicable no puede pertenecer a ningún grupo aplicable;
- los criterios aplicables deben quedar completamente clasificados;
- `NO_APPLICABLE_COVERAGE` exige cero criterios aplicables;
- `COVERAGE_COMPLETE` no admite estados pendientes o no resueltos;
- `COVERAGE_PARTIAL` exige al menos una evaluación y al menos una condición incompleta/no resuelta;
- `COVERAGE_UNRESOLVED` no admite evaluaciones concluyentes.

## Trazabilidad

El resultado conserva por separado los identificadores de criterios aplicables, no aplicables, evaluados, no evaluados, con evidencia insuficiente e inconclusos. Además conserva `executionId` y una `basis` determinista.

## Separación de responsabilidades

F2-36 no convierte cobertura en decisión. `Coverage → Coverage Interpretation` es distinto de `Criterion Evaluation → Explicit Decision`. F2-31 continúa siendo responsable de la decisión explícita por criterio y F2-32/F2-33/F2-34 de su agregación dentro del alcance aplicable.

## Límites

F2-36 no introduce porcentajes de cobertura, score, ponderaciones, aceptación o rechazo global, compensación entre criterios, criterios críticos, thresholds, reglas de parada, agregación entre ejecuciones o escenarios ni inferencia automática de aplicabilidad.

## Salida implementada

- `src/domain/evaluation/EvaluationCoverageInterpretation.ts`
- `src/application/evaluation/InterpretEvaluationCoverage.ts`
- `src/application/evaluation/InterpretEvaluationCoverage.test.ts`
- `spike/evaluation/coverage-interpretation-validation.test.ts`

## Criterio de salida

La validación final quedó demostrada por CI `34142357978` y Architecture Spike `34142357977`, ambos completamente exitosos, incluyendo TypeScript, pruebas unitarias, BDD, Playwright, migraciones PostgreSQL y Quality Gate.

## Siguiente paso

F2-37 formaliza métricas descriptivas de cobertura por ejecución, sin convertirlas en scoring ni calidad global.
