# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 **VALIDADO**.

## Incremento actual — cierre del spike técnico F3

**Estado:** F3 VALIDADO; siguiente trabajo centrado en completar las decisiones pendientes del producto y preparar el siguiente frente de desarrollo.

La validación anterior quedó cerrada con CI y Architecture Spike en verde sobre `6392c352`. Posteriormente se implementó y verificó SPIKE-008, y el run `34089149510` completó todos los gates del spike con resultado **success**.

El artifact `architecture-spike-evidence` fue publicado y su manifiesto `artifacts/spike-008-evidence-manifest.json` registra el `runId`, `runUrl`, `commitSha`, `ref`, timestamp y hashes SHA-256 de la evidencia publicada. El digest del artifact es `sha256:50fdcb7f797593a84b770a7b5a6f82bfe3603726b4fc8eb56dfd50a48844e169`.

## Verificación observada

- CI `34088800826`, commit `6392c352`: **success** en TypeScript, migraciones PostgreSQL, pruebas, BDD, Playwright y quality gate.
- Architecture Spike `34088800815`, commit `6392c352`: **success**, incluida la validación de aislamiento histórico entre ejecuciones independientes.
- Architecture Spike `34089149510`, commit `3fb8db18`: **success** en SPIKE-001 a SPIKE-012.
- SPIKE-008: manifiesto generado y publicado correctamente en el artifact.
- SPIKE-010: regla de dependencias arquitectónicas pasa.
- SPIKE-011: configuración válida e inválida pasa según contrato.
- SPIKE-012: logging estructurado correlacionado por `runId` pasa.
- F3-TECHNICAL-SPIKE.md: cerrado como **VALIDADO** en `bf0f98b1`.

## Persistencia y versionado

Las referencias mínimas de versionado continúan persistidas como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. `PostgresExecutionRepository` reconstruye el `EvaluationVersionContext` al recuperar una ejecución. Las actualizaciones de estado no sustituyen esas referencias. Las pruebas de integración verifican round-trip, inmutabilidad de referencias históricas y separación entre ejecuciones independientes.

El valor `legacy-unknown` se utiliza únicamente cuando la información histórica realmente no existía; no representa una versión metodológica válida.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Existen capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates.

## Frente 2 — Evaluación observable
**Estado:** Baseline ejecutable parcial.

Existen modelos de medición, criterios y planes ejecutables, validaciones de riesgo, repetición, trazabilidad de evaluación asistida por IA, catálogo de evidencia y una regla determinista conectada a una ejecución tangible.

Continúan pendientes la aprobación metodológica definitiva, scoring/agregación, pesos, tratamiento final de estados y validación de criterios semánticos con casos controlados.

## Frente 3 — Arquitectura
**Estado:** **VALIDADO**.

La combinación TypeScript + Node.js + arquitectura hexagonal + PostgreSQL + Cucumber/Gherkin + Playwright + GitHub Actions quedó validada mediante el spike ejecutable. La evidencia incluye compilación, pruebas de dominio/aplicación, BDD, browser automation, persistencia, controles arquitectónicos, configuración, observabilidad y trazabilidad auditable de artefactos.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution`, migraciones y pruebas de versionado implementados y validados.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Con F3 cerrado, el siguiente foco es el Frente 2: consolidar el contrato metodológico de evaluación observable antes de introducir scoring global. La prioridad inmediata es convertir las decisiones pendientes de dimensiones, criterios, estados, pesos y criterios críticos en contratos deterministas y pruebas de casos controlados.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
