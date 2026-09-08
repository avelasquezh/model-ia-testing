# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-08  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Avance estimado del MVP:** **89%**  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Gobierno de Frente 2

La baseline oficial del MVP de F2 comprende exactamente **F2-01 a F2-35**. La fuente normativa es `docs/evaluation/F2-INCREMENT-BASELINE.md`.

No se utilizarán identificadores `F2-36`, `F2-37` ni superiores para ampliar retrospectivamente el plan oficial. Los artefactos históricos que ya llevan esos nombres se conservan por trazabilidad de Git, pero se clasifican como trabajo posterior mediante la nomenclatura canónica `F2-EXT-*` o `F2-VAL-*`.

### Reconciliación del trabajo posterior a F2-35

| Identificador histórico | Clasificación canónica | Estado | Contenido |
|---|---|---|---|
| F2-36 | `F2-EXT-01` | VALIDADO | Interpretación de cobertura por ejecución |
| F2-37 | `F2-EXT-02` | VALIDADO | Métricas descriptivas de cobertura por ejecución |
| F2-38 | `F2-EXT-03` | VALIDADO | Comparabilidad metodológica entre ejecuciones |
| F2-39 | `F2-EXT-04` | VALIDADO | Comparación descriptiva de métricas de cobertura |
| F2-40 | `F2-EXT-05` | VALIDADO | Interpretación descriptiva de diferencias entre ejecuciones |
| F2-41 | `F2-VAL-01` | VALIDADO | Validación controlada de dimensiones y criterios candidatos |
| F2-42 | `F2-VAL-02` | VALIDADO | Validación empírica controlada de criterios seleccionados |
| F2-43 | `F2-VAL-03` | VALIDADO | Validación empírica de retención de contexto |
| F2-44 | `F2-VAL-04` | VALIDADO | Contrato y protocolo controlado de evaluación semántica asistida por IA |
| F2-45 | `F2-EXT-06` | VALIDADO | Frontera provider-neutral para evaluador semántico IA |
| F2-46 | `F2-EXT-07` | RETIRADO / NO ADOPTADO | Adaptación Ollama y validación live descartadas del alcance |

Esta tabla es administrativa y no cambia la identidad histórica de los archivos. La secuencia oficial continúa siendo F2-01…F2-35.

## Evidencia de F2-35

F2-35 formalizó la cobertura metodológica por criterio dentro de una ejecución. La cobertura distingue `APPLICABLE_EVALUATED`, `APPLICABLE_NOT_EVALUATED`, `NOT_APPLICABLE`, `INSUFFICIENT_EVIDENCE` e `INCONCLUSIVE`, sin introducir score ni decisión global. fileciteturn355file0L2-L2

## Trabajo posterior reconciliado — F2-38 a F2-40

### `F2-EXT-03` — Comparabilidad metodológica entre ejecuciones

**Estado:** **CERRADO / VALIDADO**.

La comparabilidad se estableció como precondición para comparar métricas entre ejecuciones. Exige coincidencia de escenario, versión de escenario, método, catálogo, reglas, condiciones, contexto, alcance, selección y aplicabilidad. `productVersion` permanece observable sin bloquear por sí sola la comparación.

Validación final: CI `34147632091` y Architecture Spike `34147632105`, ambos exitosos. fileciteturn384file0L2-L2

### `F2-EXT-04` — Comparación descriptiva de métricas de cobertura

**Estado:** **CERRADO / VALIDADO**.

La comparación se ejecuta únicamente cuando F2-EXT-03 determina `COMPARABLE` y expresa los deltas descriptivos como `right - left`. No interpreta las diferencias como mejora, regresión ni causalidad.

Validación final: CI `34147632091` y Architecture Spike `34147632105`, ambos exitosos. fileciteturn385file0L2-L2

### `F2-EXT-05` — Interpretación descriptiva de diferencias

**Estado:** **CERRADO / VALIDADO**.

La regla `f2-interpretation-0.1` clasifica cada delta como `INCREASED`, `DECREASED`, `UNCHANGED` o `NOT_INTERPRETABLE`, manteniendo explícitamente separadas dirección numérica y juicio de calidad.

Validación final: CI `34167130840` y Architecture Spike `34167130834`, ambos exitosos. fileciteturn386file0L2-L2

## Validación posterior de criterios — F2-VAL-01 a F2-VAL-04

### `F2-VAL-01` — Validación controlada de dimensiones y criterios candidatos

**Estado:** **CERRADO / VALIDADO**.

Se cubrió un caso representativo de D1–D7 con entrada, precondiciones, expectativa, evidencia, observación, regla y limitaciones. El protocolo valida aptitud estructural y mantiene la metodología candidata en `DRAFT`.

Validación final: CI `34171221703` y Architecture Spike `34171221652`, ambos exitosos. fileciteturn387file0L2-L2

### `F2-VAL-02` — Validación empírica controlada

**Estado:** **CERRADO / VALIDADO**.

Se realizaron tres repeticiones independientes sobre un doble conversacional controlado para D1-C01, D6-C01 y D7-C02. La evidencia demuestra repetibilidad del mecanismo de observación bajo condiciones controladas, no comportamiento de un sistema de producción.

Validación final registrada en CI `34171940346` y Architecture Spike `34171940304`, ambos exitosos.

### `F2-VAL-03` — Retención de contexto conversacional

**Estado:** **CERRADO / VALIDADO**.

Se validó D3-C01 mediante tres sesiones independientes con un turno de establecimiento y un turno de verificación. La segunda respuesta recuperó de forma reproducible el contexto establecido y se conservaron dos observaciones por ejecución.

Validación final registrada en CI `34172666958` y Architecture Spike `34172666905`, ambos exitosos. fileciteturn393file0L2-L2

### `F2-VAL-04` — Protocolo de evaluación semántica asistida por IA

**Estado:** **CERRADO / VALIDADO — CONTRATO Y PROTOCOLO**.

Se formalizó D2-C01 con evidencia primaria, intención esperada versionada, respuesta observable, contexto permitido, identidad/versionado del evaluador, prompt y método. La validación utilizó un doble metodológico controlado; no equivale a validación de un proveedor IA real.

Validación final registrada en CI `34173406820` y Architecture Spike `34173406825`, ambos exitosos.

## Extensiones de evaluador IA

### `F2-EXT-06` — Frontera provider-neutral

**Estado:** **CERRADO / VALIDADO**.

Se materializó `SemanticEvaluatorPort` con entrada y salida normalizadas, preservando evidencia primaria, intención esperada, respuesta observable y procedencia de modelo, prompt, método, criterio y evidencia.

El dominio no conoce SDKs, proveedores ni credenciales. CI y Architecture Spike verificaron el límite provider-neutral.

### `F2-EXT-07` — Ollama

**Estado:** **RETIRADO / NO ADOPTADO**.

Ollama no forma parte del alcance activo del MVP. La implementación específica fue retirada del código activo y no se realizará validación live con Ollama. La decisión no invalida `SemanticEvaluatorPort` ni el diseño provider-neutral.

## Persistencia y versionado

Las referencias de versionado continúan persistidas como campos de primera clase. El plan metodológico se conserva en `evaluation_plan` y las condiciones comparables mediante `condition_fingerprint`. La reconstrucción de `Execution` mantiene ambos metadatos.

El valor `legacy-unknown` se utiliza únicamente para información histórica realmente ausente; no completa silenciosamente nuevas ejecuciones.

## Frente 1 — Núcleo funcional

**Estado:** Implementado en gran parte y cubierto por pruebas.

## Frente 2 — Evaluación observable

**Estado:** **F2-EXT-06 VALIDADO**; Ollama retirado del alcance activo.

La baseline oficial permanece cerrada en F2-35. El trabajo posterior se gestiona como extensiones y validaciones explícitamente clasificadas, sin alterar la secuencia original.

El scoring global, ponderaciones y aceptación/rechazo global continúan bloqueados hasta que exista una decisión metodológica específica.

## Frente 3 — Arquitectura

**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions continúa validada mediante spikes ejecutables.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto y deben mantenerse reconstruibles junto con la identidad de ejecución y procedencia técnica.

## Próximo trabajo

No se debe crear un nuevo identificador `F2-XX` para continuar. El siguiente trabajo debe seleccionarse desde la clasificación posterior a F2-35 y registrarse antes de implementarlo. La siguiente prioridad debe ser una integración provider-neutral que no obligue a adoptar Ollama ni otro proveedor concreto, seguida de la validación de la interfaz externa cuando corresponda.

## Regla de documentación

Cada incremento o corrección debe actualizar el estado verificable resultante. Todo trabajo posterior a F2-35 debe declarar su clasificación canónica antes de ejecutarse y no puede redefinir retrospectivamente la baseline oficial.
