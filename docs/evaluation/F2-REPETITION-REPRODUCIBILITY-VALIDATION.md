# F2-27 — Repetición controlada y variabilidad observable

**Estado:** **IMPLEMENTADO; pendiente de validación CI**

## 1. Propósito

Formalizar cómo deben tratarse las repeticiones de un mismo escenario cuando el comportamiento del chatbot puede variar entre ejecuciones.

La repetición no sustituye la ejecución individual. Cada intento conserva su identidad, versión de escenario, condiciones y resultado.

## 2. Principio rector

La cadena metodológica queda:

`Escenario/version → Condiciones → Ejecución individual → Evidencia → Resultado individual → Conjunto de repeticiones → Análisis de variabilidad`

No se permite:

`Escenario → múltiples ejecuciones → único resultado sin trazabilidad`

## 3. Contrato ejecutable

`RepetitionSet` representa un conjunto controlado de ejecuciones comparables.

Cada ejecución debe:

- tener un `executionId` único dentro del conjunto;
- estar en estado terminal;
- pertenecer al mismo `scenarioId`;
- pertenecer a la misma `scenarioVersion` cuando el objetivo sea comparar el mismo comportamiento;
- conservar un `conditionFingerprint` para permitir comprobar comparabilidad de condiciones.

Las condiciones distintas no se interpretan automáticamente como variabilidad del chatbot: el modelo expone `hasComparableConditions` como dato explícito.

## 4. Resultado individual

El conjunto conserva la distribución exacta de estados terminales:

`PASSED`, `FAILED`, `PARTIALLY_PASSED`, `INCONCLUSIVE`, `NOT_EVALUABLE`, `ERROR`, `CANCELLED`.

`INCONCLUSIVE` y `NOT_EVALUABLE` permanecen diferenciados de `FAILED`.

## 5. Análisis de variabilidad

`AnalyzeRepetitionSet` expone únicamente:

- escenario y versión comparados;
- cantidad de repeticiones;
- si las condiciones son comparables;
- distribución de resultados individuales.

No transforma esa distribución en porcentaje de aceptación, riesgo, score ni decisión global.

Ejemplo:

`PASSED, PASSED, FAILED`

se conserva como una distribución `2 / 1`. El sistema no concluye por sí solo que exista un defecto reproducible, significancia estadística o criterio de aceptación.

## 6. Persistencia de condiciones

`Execution.conditionFingerprint` es opcional para mantener compatibilidad con ejecuciones históricas existentes, pero cuando forma parte de un conjunto de repetición controlada debe estar informado.

Se persiste en `executions.condition_fingerprint` mediante `004_execution_repeatability.sql`.

Esto permite reconstruir posteriormente si dos ejecuciones realmente compartían las condiciones declaradas.

## 7. Invariantes

1. No se permiten ejecuciones repetidas con el mismo `executionId` dentro del conjunto.
2. No se permiten ejecuciones `PENDING` o `RUNNING` dentro del conjunto analizado.
3. No se mezclan versiones diferentes del escenario en una repetición comparable.
4. Las diferencias de `conditionFingerprint` hacen explícita la no comparabilidad de condiciones.
5. Los estados indeterminados no se convierten en fallos.
6. El resultado individual nunca se elimina por construir el conjunto de repeticiones.
7. No existe una regla de parada ni un tamaño universal de muestra en este incremento.

## 8. Fuera de alcance

Este incremento no define:

- intervalos de confianza;
- pruebas de significancia;
- tamaño de muestra universal;
- reglas de parada;
- estimadores estadísticos definitivos;
- umbrales de aceptación;
- scoring;
- agregación global;
- inferencias automáticas mediante IA.

## 9. Criterio de salida

F2-27 queda cerrado cuando CI confirme compilación, pruebas de invariantes del conjunto, captura/persistencia del fingerprint, análisis de distribución y ausencia de regresiones en BDD, Playwright, PostgreSQL y quality gates.

La siguiente etapa será definir el tratamiento estadístico de la variabilidad y, solo después de validarlo, determinar cómo puede alimentar una evaluación agregada.
