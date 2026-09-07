# F2-39 — Comparación descriptiva de métricas de cobertura

**Estado:** EN VALIDACIÓN

## Propósito

F2-39 compara descriptivamente las métricas de cobertura de dos ejecuciones únicamente después de que F2-38 haya establecido `COMPARABLE`.

La comparación describe diferencias observadas entre las ejecuciones. No interpreta esas diferencias como mejora, regresión, calidad, aceptación o rechazo.

## Precondición

La entrada debe incluir un `EvaluationComparability` con estado `COMPARABLE`. No se permite calcular una comparación cuando las ejecuciones son `NON_COMPARABLE` o `INSUFFICIENT_EVIDENCE`.

Además, cada conjunto de métricas debe pertenecer a la ejecución correspondiente.

## Semántica de la diferencia

Todas las diferencias se calculan de forma determinista como:

`delta = right - left`

Se comparan descriptivamente:

- `applicableCount`;
- `evaluatedCount`;
- `notEvaluatedCount`;
- `insufficientEvidenceCount`;
- `inconclusiveCount`;
- `notApplicableCount`;
- `evaluatedCoverageRatio`;
- `incompleteCoverageRatio`;
- `unresolvedCoverageRatio`.

Cuando cualquiera de los ratios comparados es `null`, su delta también es `null`.

## Versionado

`productVersion` se conserva explícitamente para cada ejecución. Una diferencia de producto no invalida por sí sola F2-38 y no se transforma automáticamente en una conclusión de mejora o regresión.

Las dimensiones metodológicas ya verificadas por F2-38 permanecen fuera del delta: escenario, versión de escenario, método, catálogo, reglas, condiciones, contexto, alcance, selección y aplicabilidad.

Por tanto, F2-39 permite expresar, por ejemplo, que una ejecución sobre `productVersion=A` tuvo una cobertura evaluada descriptivamente distinta de otra sobre `productVersion=B`, sin atribuir causalidad ni emitir juicio de calidad.

## Invariantes

- Se requieren dos ejecuciones diferentes.
- La comparabilidad debe referirse a exactamente esas dos ejecuciones y en el mismo orden.
- El `executionId` de cada métrica debe coincidir con su ejecución.
- Solo `COMPARABLE` habilita la comparación.
- Los deltas de conteos son enteros.
- Los deltas de ratios son finitos o `null`.

## Límites metodológicos

F2-39 no introduce scoring, ponderaciones, thresholds, criterios críticos, reglas de parada, inferencia estadística, aceptación/rechazo global, compensación entre criterios, agregación entre escenarios ni evaluación semántica con IA.

Una futura interpretación de diferencias, si fuese necesaria, deberá definirse como un incremento independiente y conservará esta separación entre medición y juicio.

## Implementación

- `src/domain/evaluation/EvaluationCoverageComparison.ts`
- `src/domain/evaluation/EvaluationCoverageComparison.test.ts`
- `src/application/evaluation/CompareEvaluationCoverage.ts`
- `src/application/evaluation/CompareEvaluationCoverage.test.ts`
- `spike/evaluation/coverage-comparison-validation.test.ts`

## Criterio de salida

F2-39 podrá cerrarse cuando TypeScript, pruebas unitarias/aplicación, BDD, Playwright, migraciones y Architecture Spike finalicen correctamente en CI, y la evidencia quede registrada en `PROJECT-STATUS.md`.
