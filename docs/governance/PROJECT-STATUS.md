# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 en consolidación metodológica ejecutable y F3 **VALIDADO**.

## Incremento actual — consolidación del contrato metodológico F2

**Estado:** Incremento implementado; pendiente de validación CI y casos controlados posteriores.

Se incorporó `src/domain/evaluation/EvaluationMethodology.ts` como contrato ejecutable para representar una metodología observable sin introducir todavía scoring global. El contrato exige dimensiones y criterios identificables, relaciones consistentes, evidencia requerida, reglas explícitas, limitaciones y método de medición para criterios numéricos.

Se agregaron pruebas unitarias que cubren aceptación del contrato, dimensiones inexistentes, identificadores duplicados, método de medición numérico y declaración de evidencia. La prueba de criterio numérico fue ajustada para respetar `exactOptionalPropertyTypes` sin alterar la regla probada. La especificación del incremento quedó documentada en `docs/evaluation/F2-22-METHODOLOGICAL-CONTRACT.md`.

## Verificación observada

- CI `34088800826`, commit `6392c352`: **success** en TypeScript, migraciones PostgreSQL, pruebas, BDD, Playwright y quality gate.
- Architecture Spike `34089149510`, commit `3fb8db18`: **success** en SPIKE-001 a SPIKE-012.
- Las ejecuciones activadas por el incremento F2 estaban en curso y no se consideran evidencia de aprobación hasta finalizar.
- SPIKE-008: manifiesto generado y publicado correctamente en el artifact.
- F3-TECHNICAL-SPIKE.md: cerrado como **VALIDADO** en `bf0f98b1`.

## Persistencia y versionado

Las referencias mínimas de versionado continúan persistidas como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. `PostgresExecutionRepository` reconstruye el `EvaluationVersionContext` al recuperar una ejecución. Las actualizaciones de estado no sustituyen esas referencias. Las pruebas de integración verifican round-trip, inmutabilidad de referencias históricas y separación entre ejecuciones independientes.

El valor `legacy-unknown` se utiliza únicamente cuando la información histórica realmente no existía; no representa una versión metodológica válida.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Existen capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates.

## Frente 2 — Evaluación observable
**Estado:** Consolidación metodológica en curso.

La baseline ya contiene siete dimensiones candidatas, catálogo de criterios, evidencia, estados, reglas deterministas, repetición, trazabilidad de evaluación asistida por IA y una regla observable conectada a ejecución tangible.

El nuevo contrato ejecutable impide criterios incompletos o inconsistentes, pero no declara todavía definitiva la taxonomía ni resuelve scoring/agregación, pesos, tratamiento final de estados, criterios críticos, modelo estadístico ni validación semántica con IA.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions quedó validada mediante el spike ejecutable. La evidencia incluye compilación, pruebas de dominio/aplicación, BDD, browser automation, persistencia, controles arquitectónicos, configuración, observabilidad y trazabilidad auditable de artefactos.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution`, migraciones y pruebas de versionado implementados y validados.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Validar el contrato en CI y después someter las dimensiones y criterios candidatos a casos controlados. La siguiente decisión metodológica será delimitar qué dimensiones/criterios entran realmente al MVP y, posteriormente, formalizar tratamiento de repetición y variabilidad antes de diseñar scoring global.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
