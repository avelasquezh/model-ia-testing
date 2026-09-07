# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Incremento cerrado — F2-23 invariantes del contexto de versionado metodológico

**Estado:** **CERRADO / VALIDADO**.

Se formalizaron las invariantes que deben cumplirse para que una ejecución nueva sea históricamente reconstruible. El contexto llega explícitamente a la ejecución nueva, conserva las referencias mínimas de versionado y no utiliza la normalización `legacy-unknown` como sustituto silencioso. El alcance excluye deliberadamente scoring, pesos, agregación estadística y taxonomía definitiva.

La especificación quedó documentada en `docs/evaluation/F2-23-VERSION-CONTEXT-INVARIANTS.md`.

## Incremento cerrado — F2-24 delimitación de dimensiones del MVP

**Estado:** **CERRADO / VALIDADO**.

Se delimitó el perímetro del MVP mediante observabilidad, reproducibilidad, dependencia de canal y complejidad metodológica.

El núcleo obligatorio queda compuesto por D1 Corrección funcional observable, D2 Adecuación conversacional, D3 Continuidad contextual, D4 Robustez conversacional y D6 Rendimiento conversacional observable.

D5 Seguridad y comportamiento responsable observable queda como extensión condicionada a escenarios y políticas explícitas. D7 Calidad de interacción e interfaz queda como extensión dependiente del canal y no como requisito del núcleo conversacional.

La decisión metodológica quedó documentada en `docs/evaluation/F2-24-MVP-DIMENSION-DELIMITATION.md`.

La delimitación tiene soporte ejecutable mediante el perfil `MVP_CORE`: una composición de plan puede filtrar explícitamente el catálogo a los 18 criterios definidos como núcleo, conservar su aplicabilidad por contexto y persistir el alcance del plan.

Se añadieron pruebas para proteger el conjunto de IDs del núcleo y verificar que criterios pospuestos, como D6-C05, no entren accidentalmente en `MVP_CORE`.

Se mantienen fuera del núcleo inicial D1-C05, D3-C05, D4-C05, D6-C02 y D6-C05; D4-C02 permanece condicionado a una tolerancia definida por escenario.

El incremento no introduce scoring, pesos, estadística global ni evaluador IA productivo.

### Evidencia de cierre F2-24

- CI `34093226220`, commit `1e21df7360361f9bd3956e93c6f1d4e649c6766e`: **success** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright E2E y quality gate.
- Architecture Spike `34093226273`, mismo commit: **success** en SPIKE-001 a SPIKE-012, incluyendo integración PostgreSQL/versioning y quality gate.
- La corrección `1e21df7` alineó una prueba existente con el nuevo campo obligatorio `scope` de `EvaluationPlan`; no modificó la decisión metodológica.

## Evidencia de cierre F2-23

- CI `34091970313`, commit `8cbd5953`: **success** en TypeScript/unit tests, migraciones PostgreSQL, BDD, Playwright E2E y quality gate.
- Architecture Spike `34091970295`, commit `8cbd5953`: **success** en SPIKE-001 a SPIKE-012, incluyendo frontera PostgreSQL/versioning y quality gate.
- La evidencia confirma que el incremento F2-23 quedó integrado sin regresiones en la baseline ejecutable.

## Persistencia y versionado

Las referencias mínimas de versionado continúan persistidas como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. `PostgresExecutionRepository` reconstruye el `EvaluationVersionContext` al recuperar una ejecución. Las actualizaciones de estado no sustituyen esas referencias. Las pruebas de integración verifican round-trip, inmutabilidad de referencias históricas y separación entre ejecuciones independientes.

El valor `legacy-unknown` se utiliza únicamente cuando la información histórica realmente no existía; no representa una versión metodológica válida y no debe completar silenciosamente una ejecución nueva.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Existen capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates.

## Frente 2 — Evaluación observable
**Estado:** F2-24 cerrado/validado; selección contextual y ejecución metodológica continúan.

La baseline contiene siete dimensiones candidatas y un catálogo de criterios. F2-24 establece cuáles pertenecen al núcleo y cuáles quedan condicionadas o pospuestas, y esa decisión cuenta con una representación ejecutable mediante `EvaluationPlanScope`.

El contrato ejecutable impide criterios incompletos o inconsistentes, pero no define todavía scoring/agregación, pesos, tratamiento estadístico de repetición, criterios críticos, fórmula de riesgo definitiva ni método productivo de evaluación semántica con IA.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions quedó validada mediante el spike ejecutable. La evidencia incluye compilación, pruebas de dominio/aplicación, BDD, browser automation, persistencia, controles arquitectónicos, configuración, observabilidad y trazabilidad auditable de artefactos.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution`, migraciones y pruebas de versionado implementados y validados.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

**F2-25 — Selección contextual de criterios.** Conectar el alcance `MVP_CORE` con el contexto de escenario/ejecución mediante una selección determinista y auditable. Cada ejecución deberá poder conservar por criterio su inclusión, exclusión o `NOT_APPLICABLE`, junto con la razón y las referencias metodológicas pertinentes.

El siguiente límite sigue siendo deliberado: no introducir scoring global hasta formalizar primero la selección contextual y, posteriormente, la repetición y variabilidad.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
