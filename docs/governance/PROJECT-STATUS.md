# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Avance estimado del MVP:** **82%**  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Incrementos cerrados — F2-23 a F2-37

F2-23 a F2-37 permanecen **CERRADOS / VALIDADOS** según la evidencia CI y Architecture Spike registrada en este documento.

## Incremento cerrado — F2-38 comparabilidad metodológica entre ejecuciones

**Estado:** **CERRADO / VALIDADO**.

F2-38 formaliza la comparabilidad como precondición antes de comparar métricas de cobertura entre ejecuciones.

La implementación introduce `EvaluationComparability` y `AssessEvaluationComparability`. La comparabilidad exige coincidencia de escenario, versión de escenario, método de evaluación, catálogo de criterios, reglas de decisión, fingerprint de condiciones, contexto y alcance del `EvaluationPlan`, criterios seleccionados y aplicabilidad.

La identidad de producto bajo prueba (`productVersion`) permanece como dimensión explícita de comparación y no bloquea por sí sola la comparabilidad metodológica.

El resultado distingue `COMPARABLE`, `NON_COMPARABLE` e `INSUFFICIENT_EVIDENCE`, y conserva razones auditables. Una incompatibilidad demostrable prevalece sobre la falta de evidencia; la falta de evidencia por sí sola no se interpreta como variabilidad del sistema.

La validación final quedó registrada en el commit `308b08ca053ed1d2eb645566e83d77319f61257d`, con CI `34147632091` y Architecture Spike `34147632105`, ambos completamente exitosos.

## Incremento cerrado — F2-39 comparación descriptiva de métricas de cobertura

**Estado:** **CERRADO / VALIDADO**.

F2-39 compara descriptivamente las métricas de cobertura de dos ejecuciones únicamente después de que F2-38 establezca `COMPARABLE`.

La diferencia es determinista y se expresa como `delta = right - left`. Se comparan conteos de criterios y ratios descriptivos de cobertura. Los ratios `null` conservan `null` en su delta.

`productVersion` se conserva explícitamente para ambas ejecuciones, de modo que una diferencia de producto sea observable sin convertirla en una conclusión de mejora o regresión.

La implementación está en `EvaluationCoverageComparison` y `CompareEvaluationCoverage`, con pruebas unitarias/aplicación y Architecture Spike específica.

La validación final quedó registrada con CI `34147632091` y Architecture Spike `34147632105`, ambos completamente exitosos en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.

F2-39 permanece puramente descriptivo: no introduce scoring, ponderaciones, thresholds, criterios críticos, reglas de parada, inferencia estadística, aceptación/rechazo global, compensación entre criterios, agregación entre escenarios ni evaluación semántica con IA.

## Incremento cerrado — F2-40 interpretación descriptiva de diferencias entre ejecuciones

**Estado:** **CERRADO / VALIDADO**.

F2-40 introduce una capa descriptiva sobre los deltas producidos por F2-39. Recibe exclusivamente un `EvaluationCoverageComparison` y no recalcula cobertura ni comparabilidad.

La regla versionada `f2-interpretation-0.1` mapea determinísticamente cada delta: positivo a `INCREASED`, negativo a `DECREASED`, cero a `UNCHANGED` y `null` a `NOT_INTERPRETABLE`.

La implementación conserva las identidades de las ejecuciones, las versiones de producto, la versión de la regla y una base explicativa. No transforma la dirección numérica en mejora, regresión, calidad, aceptación, rechazo o causalidad.

La validación final quedó registrada sobre el commit `6a55bf1d168e37049e385ef5824766bbb0bd0395`, con CI `34167130840` (`#286`) y Architecture Spike `34167130834`, ambos completamente exitosos.

## Incremento cerrado — F2-41 validación controlada de dimensiones y criterios candidatos

**Estado:** **CERRADO / VALIDADO**.

F2-41 convierte en protocolo ejecutable la decisión pendiente del Frente 2 sobre la observabilidad y reproducibilidad de criterios candidatos. Se cubrió un caso representativo de cada dimensión D1–D7, con entrada, precondiciones, expectativa, evidencia, mecanismo de observación, regla y limitaciones explícitas.

La metodología candidata permanece deliberadamente en estado `DRAFT`. F2-41 valida la aptitud estructural del protocolo, pero no congela todavía la taxonomía como definitiva ni convierte la validación en una medida de calidad del producto.

Para el criterio asistido por IA se exige conservar evidencia primaria y declarar la asistencia de IA. El criterio numérico exige método de medición explícito.

La corrección final de tipado quedó registrada en el commit `020e9b8a638fd02fd4a881ea183a151d2cc936ec`.

Validación final:

- CI `34171221703` (`#293`) — **SUCCESS** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.
- Architecture Spike `34171221652` (`#461`) — **SUCCESS** en TypeScript, pruebas unitarias/arquitectura, BDD, Playwright, migraciones PostgreSQL, integración de repositorio/versionado, manifiesto de evidencia, artefactos y Quality Gate.

El primer intento de validación falló por dos incompatibilidades de TypeScript causadas por `exactOptionalPropertyTypes`; fueron corregidas sin modificar el contrato metodológico y validadas en la segunda ejecución.

## Persistencia y versionado

Las referencias de versionado continúan persistidas como campos de primera clase. El plan metodológico se conserva en `evaluation_plan` y las condiciones comparables mediante `condition_fingerprint`. La reconstrucción de `Execution` mantiene ambos metadatos.

El valor `legacy-unknown` se utiliza únicamente para información histórica realmente ausente; no completa silenciosamente nuevas ejecuciones.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

## Frente 2 — Evaluación observable
**Estado:** F2-41 **CERRADO / VALIDADO**.

La secuencia materializada llega hasta: delimitación de núcleo → selección contextual → vinculación con ejecución → repetición/variabilidad → estadística descriptiva → interpretación → juicio metodológico → decisión explícita mediante regla versionada → agregación de decisiones → vinculación de la agregación con el conjunto de criterios seleccionado → separación de criterios `APPLICABLE` y `NOT_APPLICABLE` en la agregación → cobertura metodológica por criterio → interpretación de cobertura por ejecución → métricas descriptivas de cobertura por ejecución → comparabilidad metodológica entre ejecuciones → comparación descriptiva de métricas de cobertura → interpretación descriptiva de diferencias entre ejecuciones → validación controlada de dimensiones y criterios candidatos.

Todavía quedan fuera la interpretación normativa de diferencias entre ejecuciones, scoring, ponderaciones, criterios críticos definitivos, reglas de parada, agregación entre escenarios y método productivo de evaluación semántica con IA.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions continúa validada mediante el spike ejecutable.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto y deben mantenerse reconstruibles junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento — F2-42 validación empírica controlada

F2-42 deberá ejecutar casos controlados sobre un sistema conversacional real o un doble de prueba representativo, capturando evidencia real y repeticiones bajo condiciones constantes.

La finalidad será determinar, para criterios candidatos seleccionados, si las propiedades observadas son realmente reproducibles y suficientemente evidenciadas para entrar al catálogo ejecutable. El resultado seguirá siendo metodológico: `SUPPORTED`, `REQUIRES_REFINEMENT`, `NOT_OBSERVABLE` o `INSUFFICIENT_EVIDENCE`.

F2-42 no deberá introducir scoring global, ponderaciones, criterios críticos, umbrales globales, causalidad ni evaluación semántica autónoma basada exclusivamente en IA.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
