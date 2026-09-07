# F2-40 — Interpretación descriptiva de diferencias entre ejecuciones

**Estado:** EN VALIDACIÓN

## Propósito

F2-40 introduce una capa de interpretación descriptiva sobre los deltas producidos por F2-39. No modifica la medición y no emite juicio normativo.

## Precondición

La entrada debe ser un `EvaluationCoverageComparison` producido por F2-39. F2-39 ya garantiza que las ejecuciones sean metodológicamente `COMPARABLE`.

F2-40 no recalcula cobertura ni vuelve a evaluar comparabilidad.

## Regla versionada

La versión inicial es:

`f2-interpretation-0.1`

Para cada delta:

- `delta > 0` → `INCREASED`;
- `delta < 0` → `DECREASED`;
- `delta = 0` → `UNCHANGED`;
- `delta = null` → `NOT_INTERPRETABLE`.

La regla se aplica de forma idéntica a conteos y ratios.

Un delta positivo o negativo describe dirección numérica únicamente. No significa mejora, regresión, mayor calidad, menor calidad, aceptación ni rechazo.

## Resultado

`EvaluationCoverageDifferenceInterpretation` conserva:

- identidad de las ejecuciones izquierda y derecha;
- `productVersion` de ambas ejecuciones;
- `interpretationRuleVersion`;
- dirección descriptiva de cada métrica de cobertura;
- `basis` explicativa.

Las versiones de producto permanecen visibles porque una diferencia entre productos puede coexistir con comparabilidad metodológica, pero F2-40 no atribuye causalidad a esa diferencia.

## Invariantes

- Las ejecuciones izquierda y derecha deben ser distintas.
- La versión de la regla debe estar presente y soportada explícitamente.
- `null` no puede transformarse en `INCREASED`, `DECREASED` o `UNCHANGED`.
- La interpretación debe conservar el orden izquierda/derecha de F2-39.
- No se introducen nuevos denominadores, métricas ni cálculos estadísticos.

## Límites metodológicos

F2-40 no introduce:

- clasificación de mejora o regresión;
- causalidad;
- scoring;
- ponderaciones;
- thresholds;
- criterios críticos;
- reglas de parada;
- aceptación o rechazo global;
- significancia estadística;
- agregación entre escenarios;
- evaluación semántica con IA.

Cualquier juicio normativo posterior deberá consumir esta interpretación como entrada y definirse mediante otro incremento y otra regla versionada.

## Implementación

- `src/domain/evaluation/EvaluationCoverageDifferenceInterpretation.ts`
- `src/domain/evaluation/EvaluationCoverageDifferenceInterpretation.test.ts`
- `src/application/evaluation/InterpretEvaluationCoverageDifference.ts`
- `src/application/evaluation/InterpretEvaluationCoverageDifference.test.ts`
- `spike/evaluation/difference-interpretation-validation.test.ts`

## Criterio de salida

F2-40 podrá cerrarse cuando TypeScript, pruebas unitarias/aplicación, BDD, Playwright, migraciones y Architecture Spike finalicen correctamente en CI, y la evidencia quede registrada en `PROJECT-STATUS.md`.
