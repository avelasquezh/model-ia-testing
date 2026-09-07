# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — versionado auditable persistido

**Estado:** implementado; pruebas unitarias, aplicación y prueba de integración PostgreSQL incluidas. El gate CI del incremento debe considerarse pendiente hasta que su workflow termine.

El contexto `EvaluationVersionContext` forma parte obligatoria de `Execution` y es propagado desde `ExecuteScenario`/`ExecuteSuite`. Las referencias mínimas de versionado se persisten como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. El adaptador `PostgresExecutionRepository` permite guardar y reconstruir la ejecución con su contexto.

Se añadió una prueba de inmutabilidad histórica: actualizar el estado de una ejecución no puede reemplazar las referencias metodológicas con las de otra versión. La migración usa `legacy-unknown` para datos históricos sin versión conocida; esto representa ausencia de información y no inventa una versión.

## Verificación del incremento

- Contrato de versión: probado.
- Inmutabilidad del contexto durante el ciclo de `Execution`: probado.
- Persistencia PostgreSQL del contexto: implementada.
- Recuperación PostgreSQL del contexto: cubierta por integración.
- Protección de referencias ante actualización de una ejecución existente: cubierta por integración.
- CI del commit: iniciado; la conclusión todavía no ha sido observada.

## Corrección de documentación

README, `PROJECT-STATUS.md`, ADR-015 y `PENDING-DECISIONS.md` se mantienen alineados con el nivel real de implementación. Los documentos diferencian diseño, implementación y validación.

## Estado comprobado

### Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Existen capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates.

### Frente 2 — Evaluación observable
**Estado:** Baseline ejecutable parcial.

Existen modelos de medición, criterios y planes ejecutables, validaciones de riesgo, repetición, trazabilidad de evaluación asistida por IA, catálogo de evidencia y una regla determinista conectada a una ejecución tangible.

Continúan pendientes la aprobación metodológica definitiva, scoring/agregación, pesos, tratamiento final de estados y validación de criterios semánticos con casos controlados.

### Frente 3 — Arquitectura
**Estado:** Baseline materializada parcialmente; spike técnico aún abierto.

La solución ya materializa TypeScript estricto, monolito modular, arquitectura hexagonal, Playwright mediante adaptadores, GitHub Actions y PostgreSQL con migraciones reproducibles. Esto no constituye por sí solo una validación completa del spike.

### Persistencia
**Estado:** Schema MVP reproducible y repositorio PostgreSQL de `Execution` implementados; validación operacional integral aún pendiente del gate CI.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Registrar la conclusión del gate CI y, si queda en verde, validar formalmente el cambio de versión metodológica sin mutación retrospectiva. Luego continuar con el siguiente gate del spike F3.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
