# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — SPIKE-008 evidencia auditable

**Estado:** manifiesto de evidencia implementado; ejecución del spike pendiente de conclusión observable.

La validación anterior quedó cerrada con CI y Architecture Spike en verde sobre `d1e7abbc`. El siguiente gate del spike es SPIKE-008, que exige un artifact con metadata vinculada inequívocamente al workflow run.

Se implementó `scripts/create-evidence-manifest.ts`, que genera `artifacts/spike-008-evidence-manifest.json` a partir del contexto de GitHub Actions. El manifiesto registra versión de esquema, gate, workflow, `runId`, `runUrl`, `commitSha`, `ref`, timestamp y SHA-256 de los archivos de evidencia encontrados. El workflow del spike ejecuta esta generación después de las pruebas y antes de publicar el artifact.

## Verificación observada

- CI `34088059883`, commit `d1e7abbc`: **success**.
- Architecture Spike `34088059889`, commit `d1e7abbc`: **success**.
- SPIKE-008: implementación realizada en `e2c602fc` y conectada al workflow en `e70992f5`.
- Especificación del spike actualizada en `3fb8db18`.
- Nuevo workflow generado por este incremento: pendiente de conclusión observable.
- No se declara SPIKE-008 validado hasta comprobar el artifact y su metadata en una ejecución completada.

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
**Estado:** Baseline materializada parcialmente; persistencia, versionado y pipeline técnico validados; SPIKE-008 activo.

La solución ya materializa TypeScript estricto, monolito modular, arquitectura hexagonal, Playwright mediante adaptadores, GitHub Actions y PostgreSQL con migraciones reproducibles. El siguiente objetivo es demostrar trazabilidad auditable de los artefactos producidos por cada run.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution`, migraciones y pruebas de versionado implementados. Integración PostgreSQL y aislamiento entre ejecuciones independientes validados.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Verificar SPIKE-008 en Actions, comprobando que el manifiesto generado contiene `runId` y `commitSha` correctos y que se publica junto con los artefactos. Si el gate queda verde, continuar con SPIKE-009 y la consolidación formal del resultado del spike.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
