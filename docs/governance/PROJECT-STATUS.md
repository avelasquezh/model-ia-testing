# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-08  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Avance estimado del MVP:** **88%**  
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

## Incremento cerrado — F2-42 validación empírica controlada

**Estado:** **CERRADO / VALIDADO**.

F2-42 extendió F2-41 hacia evidencia empírica obtenida mediante ejecución repetida sobre un doble conversacional controlado. Se validaron directamente tres candidatos: D1-C01 — respuesta funcional esperada; D6-C01 — tiempo hasta respuesta observable; D7-C02 — entrada de mensaje utilizable.

D3-C01 quedó fuera porque el target controlado no conserva contexto conversacional entre turnos. D2-C01 permanece fuera por depender de un método reproducible de comparación semántica asistida por IA que aún no está cerrado. D4 y D5 requieren protocolos específicos adicionales.

La prueba ejecutó tres repeticiones independientes bajo las mismas condiciones y verificó respuesta observable reproducible, medición de duración, screenshot no vacío y publicación de evidencia mediante `ExecutionEvidencePublisher`. El runner mantuvo el resultado `INCONCLUSIVE`, preservando la separación entre ejecución/observación y evaluación metodológica.

La evidencia demuestra repetibilidad del mecanismo de observación sobre el doble controlado. No constituye evidencia de comportamiento de un sistema de producción.

Validación final:

- Commit `6e82f308181c230fe6ad1da4798d67041ba1b5a6`.
- CI `34171940346` (`#302`) — **SUCCESS** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.
- Architecture Spike `34171940304` (`#470`) — **SUCCESS** en TypeScript, pruebas unitarias/arquitectura, BDD, Playwright, migraciones PostgreSQL, integración de repositorio/versioning, manifiesto de evidencia, publicación de artefactos y Quality Gate.

El primer intento sobre la implementación tuvo un fallo de `TS18048` causado por acceso a `result.observations` bajo TypeScript estricto. Se corrigió estrechando explícitamente la observación primaria sin relajar el compilador ni modificar el contrato metodológico.

## Incremento cerrado — F2-43 retención de contexto conversacional

**Estado:** **CERRADO / VALIDADO**.

F2-43 llevó D3-C01 desde la exclusión de F2-42 hacia un protocolo empírico controlado para estado entre turnos. Se implementó un doble conversacional con un turno de establecimiento y un turno de verificación que no repite literalmente el dato establecido.

Se ejecutaron tres repeticiones independientes con sesiones de navegador nuevas bajo las mismas condiciones. En las tres se observó recuperación reproducible del dato, dos observaciones por ejecución, duración no negativa, screenshots no vacíos y dos eventos `OBSERVATION` con `turnIndex` `[0, 1]` publicados mediante `ExecutionEvidencePublisher`.

El resultado metodológico es `SUPPORTED`. El resultado pertenece al protocolo y no representa PASS/FAIL del producto. La evidencia se limita al doble controlado y no constituye evidencia de comportamiento de un sistema de producción.

Validación final:

- Commit `99ab76be7d2e1349d9abd89640501cf1cdd76b18`.
- CI `34172666958` (`#309`) — **SUCCESS** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.
- Architecture Spike `34172666905` (`#477`) — **SUCCESS** en TypeScript, pruebas unitarias/arquitectura, BDD, Playwright, migraciones PostgreSQL, integración de repositorio/versionado, manifiesto de evidencia, artefactos y Quality Gate.

El primer intento falló por `TS2339` al acceder a `turnIndex` sobre la unión `ExecutionEvidenceEvent`. Se corrigió estrechando los eventos a `OBSERVATION`, sin relajar TypeScript ni modificar el contrato metodológico.

## Incremento cerrado — F2-44 protocolo de evaluación semántica reproducible asistida por IA

**Estado:** **CERRADO / VALIDADO (CONTRATO Y PROTOCOLO)**.

F2-44 formalizó y validó el contrato mínimo para D2-C01 — correspondencia con intención. El evaluador recibe explícitamente evidencia primaria, entrada, intención esperada versionada, respuesta observable, contexto permitido, identidad/versionado del evaluador, versión de prompt y versión metodológica.

La salida quedó normalizada como resultado ordinal, justificación, insuficiencia de evidencia e identidad/versionado del evaluador. El protocolo distingue controladamente casos alineado, no alineado y ambiguo, y conserva la separación entre evidencia primaria y análisis asistido.

La validación se realizó mediante `spike/evaluation/f2-44-semantic-evaluation-protocol.test.ts` utilizando un doble metodológico controlado (`controlled-semantic-evaluator`, `double-0.1`). Las repeticiones demostraron estabilidad bajo condiciones idénticas y la evidencia mantiene trazabilidad de la entrada al análisis.

**Resultado metodológico:** `SUPPORTED` para el contrato y protocolo controlado de D2-C01.

Esta validación no equivale a una integración ni validación de un proveedor de IA real. No se introduce scoring global, ponderación, umbral global, aceptación/rechazo global ni inferencia autónoma de intención. La validación posterior de un proveedor/modelo real deberá reutilizar este contrato y caracterizar su variabilidad.

Validación final:

- Commit de corrección validado: `a13453d9100815fe6cdc4a0bc711020711a08b1a`.
- CI `34173406820` (`#317`) — **SUCCESS** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright y Quality Gate.
- Architecture Spike `34173406825` (`#485`) — **SUCCESS** en TypeScript, pruebas unitarias/arquitectura, BDD, Playwright, migraciones PostgreSQL, integración de repositorio/versionado, manifiesto de evidencia, artefactos y Quality Gate.

El primer intento falló por errores de TypeScript bajo configuración estricta: faltaba `observedResponse` en el caso base y el acceso indexado a casos generaba posibles `undefined`. Se corrigió tipando explícitamente el contrato base y usando una tupla de casos controlados, sin relajar el compilador ni modificar el objetivo metodológico.

## Persistencia y versionado

Las referencias de versionado continúan persistidas como campos de primera clase. El plan metodológico se conserva en `evaluation_plan` y las condiciones comparables mediante `condition_fingerprint`. La reconstrucción de `Execution` mantiene ambos metadatos.

El valor `legacy-unknown` se utiliza únicamente para información histórica realmente ausente; no completa silenciosamente nuevas ejecuciones.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

## Frente 2 — Evaluación observable
**Estado:** F2-44 **CERRADO / VALIDADO (CONTRATO Y PROTOCOLO)**.

La secuencia materializada llega hasta: delimitación de núcleo → selección contextual → vinculación con ejecución → repetición/variabilidad → estadística descriptiva → interpretación → juicio metodológico → decisión explícita mediante regla versionada → agregación de decisiones → vinculación de la agregación con el conjunto de criterios seleccionado → separación de criterios `APPLICABLE` y `NOT_APPLICABLE` en la agregación → cobertura metodológica por criterio → interpretación de cobertura por ejecución → métricas descriptivas de cobertura por ejecución → comparabilidad metodológica entre ejecuciones → comparación descriptiva de métricas de cobertura → validación controlada de dimensiones y criterios candidatos → validación empírica repetida de criterios seleccionados sobre doble controlado → validación empírica de retención de contexto entre turnos sobre doble controlado → contrato y protocolo controlado de evaluación semántica asistida por IA para D2-C01.

Todavía quedan fuera la interpretación normativa de diferencias entre ejecuciones, scoring, ponderaciones, criterios críticos definitivos, reglas de parada, agregación entre escenarios y validación de un proveedor/modelo de IA real en condiciones controladas.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions continúa validada mediante spikes ejecutables.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto y deben mantenerse reconstruibles junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento — validación de proveedor/modelo IA real para D2-C01

El siguiente incremento deberá tomar el contrato cerrado en F2-44 y evaluar su comportamiento con un proveedor o modelo de IA real bajo condiciones controladas. El objetivo será caracterizar reproducibilidad, sensibilidad a configuración, suficiencia de evidencia y estabilidad del resultado sin convertir la salida del modelo en un veredicto global.

Deberán mantenerse el control de intención esperada previamente definida, evidencia primaria, identificación/versionado del modelo, prompt versionado, parámetros relevantes, salida estructurada y reglas explícitas. La selección de proveedor deberá tratarse como decisión técnica posterior al contrato, no como supuesto metodológico.

Scoring global, ponderaciones y aceptación/rechazo global continúan bloqueados.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
