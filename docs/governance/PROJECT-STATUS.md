# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Incremento cerrado — F2-23 invariantes del contexto de versionado metodológico

**Estado:** **CERRADO / VALIDADO**.

Se formalizaron las invariantes que deben cumplirse para que una ejecución nueva sea históricamente reconstruible. El contexto llega explícitamente a la ejecución nueva, conserva las referencias mínimas de versionado y no utiliza la normalización `legacy-unknown` como sustituto silencioso. El alcance excluye deliberadamente scoring, pesos, agregación estadística y taxonomía definitiva.

## Incremento cerrado — F2-24 delimitación de dimensiones del MVP

**Estado:** **CERRADO / VALIDADO**.

Se delimitó el núcleo obligatorio mediante D1 Corrección funcional observable, D2 Adecuación conversacional, D3 Continuidad contextual, D4 Robustez conversacional y D6 Rendimiento conversacional observable. D5 y D7 permanecen condicionadas por escenario/canal.

## Incremento cerrado — F2-25 selección contextual de criterios

**Estado:** **CERRADO / VALIDADO**.

`EvaluationSelectionContext` determina explícitamente `scenarioId`, `scenarioVersion`, `executionContext`, `scope` y `selectedCriterionIds`. La selección se valida contra el catálogo y el alcance, y no incorpora criterios adicionales por inferencia.

## Incremento cerrado — F2-26 vinculación del plan de evaluación con la ejecución

**Estado:** **CERRADO / VALIDADO**.

`Execution` conserva un snapshot opcional de `EvaluationPlan`; la selección contextual se valida contra el escenario y su versión reales, se compone antes del runner y se persiste como JSONB sin ser sustituida durante la actualización terminal.

## Incremento cerrado — F2-27 repetición controlada y variabilidad observable

**Estado:** **CERRADO / VALIDADO**.

`RepetitionSet` representa ejecuciones terminales independientes del mismo escenario y versión comparable. Impide duplicados de `executionId`, mezclar escenarios/versiones o utilizar ejecuciones `PENDING`/`RUNNING` como repeticiones.

`Execution` conserva `conditionFingerprint` y PostgreSQL lo persiste mediante `004_execution_repeatability.sql`. `AnalyzeRepetitionSet` conserva la distribución completa y la comparabilidad de condiciones sin convertir variabilidad en score.

## Incremento cerrado — F2-28 tratamiento estadístico descriptivo de la variabilidad

**Estado:** **CERRADO / VALIDADO**.

`ProportionInterval` implementa intervalo Wilson al 95% para proporciones, manteniendo límites `[0,1]` y validando conteos y parámetros.

`AnalyzeRepetitionStatistics` calcula `N_total`, `N_evaluable`, estados indeterminados y técnicos, distribución PASS/PARTIAL/FAIL y tasas observadas con denominador explícito `N_evaluable`. Cuando no existen ejecuciones evaluables, las tasas permanecen `null`.

Los intervalos de Wilson son indicadores descriptivos de incertidumbre. No establecen umbrales de aceptación, significancia obligatoria, tamaño de muestra, regla de parada, score ni agregación global.

La especificación quedó documentada en `docs/evaluation/F2-STATISTICAL-VARIABILITY-VALIDATION.md` y el diseño ejecutable en `docs/evaluation/F2-28-STATISTICAL-VARIABILITY-TREATMENT.md`.

La evidencia CI `34109718014` y Architecture Spike `34109718012` resultó exitosa en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

## Incremento cerrado — F2-29 interpretación metodológica de indicadores

**Estado:** **CERRADO / VALIDADO**.

F2-29 establece una interpretación determinista sobre las estadísticas de repetición, separando la descripción estadística del juicio de calidad.

Los estados interpretativos son `NON_COMPARABLE`, `NO_EVALUABLE_OBSERVATION`, `CONSISTENT_OBSERVED` y `VARIABLE_OBSERVED`. La precedencia es determinista: no comparabilidad → ausencia de resultados evaluables → consistencia observada → variabilidad observada.

La interpretación es derivada y auditable; no sustituye las ejecuciones individuales, la distribución ni los indicadores que la originaron.

Ningún estado interpretativo determina aceptación, rechazo, defecto reproducible, significancia estadística, score, regla de parada ni calidad global del producto.

La especificación está documentada en `docs/evaluation/F2-29-STATISTICAL-INTERPRETATION.md`.

La evidencia CI `34113055452` y Architecture Spike `34113055442` resultó exitosa en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

## Incremento cerrado — F2-30 contrato de juicio metodológico

**Estado:** **CERRADO / VALIDADO**.

F2-30 establece la frontera entre interpretación estadística y juicio metodológico. El contrato permite `OBSERVED_CONSISTENT`, `OBSERVED_VARIABLE` y `NO_JUDGMENT`, derivados de manera determinista de F2-29.

`NON_COMPARABLE` y `NO_EVALUABLE_OBSERVATION` producen `NO_JUDGMENT`; `CONSISTENT_OBSERVED` produce `OBSERVED_CONSISTENT`; `VARIABLE_OBSERVED` produce `OBSERVED_VARIABLE`.

Cada juicio conserva una `basis` explicativa y sigue siendo derivado: no sustituye evidencia, ejecuciones, distribución, estadísticas ni interpretación.

F2-30 no introduce aceptación/rechazo, umbrales, scoring, ponderaciones, reglas de parada, significancia estadística, defectos críticos ni agregación global.

La especificación está documentada en `docs/evaluation/F2-30-METHODOLOGICAL-JUDGMENT.md`.

La evidencia CI `34113505026` y Architecture Spike `34113504953` resultó exitosa en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

## Incremento actual — F2-31 contrato explícito de decisión de evaluación

**Estado:** **IMPLEMENTADO; pendiente de validación CI**.

F2-31 introduce `EvaluationDecisionResult` con los estados `ACCEPTED`, `REJECTED` y `UNDECIDED`.

`BuildEvaluationDecision` recibe el estado de una evaluación de criterio y una regla metodológica explícita y versionada. La decisión se deriva exclusivamente de esa regla; el componente no contiene una regla universal de aceptación ni rechazo.

Cada decisión conserva `ruleVersion` y `basis`, permitiendo reconstruir qué regla produjo el resultado y por qué fue obtenido.

F2-31 no introduce `PASS = ACCEPTED`, `FAIL = REJECTED`, agregación de múltiples criterios, ponderaciones, scoring, umbrales estadísticos, reglas de parada, significancia, defectos críticos ni aceptación global del producto.

La especificación está documentada en `docs/evaluation/F2-31-EXPLICIT-EVALUATION-DECISION.md`.

## Persistencia y versionado

Las referencias de versionado continúan persistidas como campos de primera clase. El plan metodológico se conserva en `evaluation_plan` y las condiciones comparables mediante `condition_fingerprint`. La reconstrucción de `Execution` mantiene ambos metadatos.

El valor `legacy-unknown` se utiliza únicamente para información histórica realmente ausente; no completa silenciosamente nuevas ejecuciones.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

## Frente 2 — Evaluación observable
**Estado:** F2-30 cerrado/validado; F2-31 implementado y en validación.

La secuencia actual es: delimitación de núcleo → selección contextual → vinculación con ejecución → repetición/variabilidad → estadística descriptiva → interpretación → juicio metodológico → decisión explícita mediante regla versionada. Todavía quedan fuera scoring, ponderaciones, criterios críticos definitivos, reglas de parada, agregación global y método productivo de evaluación semántica con IA.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions continúa validada mediante el spike ejecutable.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto y deben mantenerse reconstruibles junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Validar F2-31 en CI. Con la baseline verde, el siguiente paso será establecer, por separado, una política explícita de agregación de múltiples criterios y precedencia de estados indeterminados, sin convertirla en scoring global por defecto.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
