# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — corrección del CI general PostgreSQL

**Estado:** corrección de infraestructura de pruebas implementada; nuevo CI pendiente de conclusión.

El CI `34087581936` tenía TypeScript en verde, pero el job de calidad fallaba porque `npm test` incluía pruebas que requieren PostgreSQL mientras el workflow general no declaraba ningún servicio PostgreSQL. En consecuencia, las pruebas recibían `ECONNREFUSED` sobre `localhost:5432`. El `Architecture Spike` ya había demostrado que el código y la integración PostgreSQL podían ejecutarse correctamente cuando el servicio estaba disponible.

La corrección añade PostgreSQL 17 al job `quality` del CI general, espera su disponibilidad mediante healthcheck y proporciona explícitamente `DATABASE_URL` a las pruebas. No se modificó código de dominio ni persistencia.

## Verificación observada

- `Architecture Spike` `34087581949`: **success** en todos los gates, incluyendo PostgreSQL, BDD, Playwright y versionado.
- CI `34087581936`: **failed** únicamente porque faltaba PostgreSQL en el job que ejecutaba `npm test`.
- Corrección del workflow `ci.yml`: implementada en `6d790311`.
- Nuevo CI provocado por la corrección: pendiente de conclusión observable.
- No se declara verde ningún gate hasta disponer de conclusión `success` observable.

## Persistencia y versionado

Las referencias mínimas de versionado continúan persistidas como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. `PostgresExecutionRepository` reconstruye el `EvaluationVersionContext` al recuperar una ejecución. Las actualizaciones de estado no sustituyen esas referencias.

El valor `legacy-unknown` se utiliza únicamente cuando la información histórica realmente no existía; no representa una versión metodológica válida.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Existen capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates.

## Frente 2 — Evaluación observable
**Estado:** Baseline ejecutable parcial.

Existen modelos de medición, criterios y planes ejecutables, validaciones de riesgo, repetición, trazabilidad de evaluación asistida por IA, catálogo de evidencia y una regla determinista conectada a una ejecución tangible.

Continúan pendientes la aprobación metodológica definitiva, scoring/agregación, pesos, tratamiento final de estados y validación de criterios semánticos con casos controlados.

## Frente 3 — Arquitectura
**Estado:** Baseline materializada parcialmente; spike técnico aún abierto.

La solución ya materializa TypeScript estricto, monolito modular, arquitectura hexagonal, Playwright mediante adaptadores, GitHub Actions y PostgreSQL con migraciones reproducibles. El spike tiene una ejecución verde observable; esto no convierte todavía todo el producto en un MVP productivo.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution` y pruebas de versionado implementados. La integración PostgreSQL está validada por el spike; el CI general queda en recuperación.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Verificar el nuevo CI general. Si queda verde, cerrar la recuperación de infraestructura y ejecutar la validación histórica de dos ejecuciones independientes con contextos metodológicos distintos, verificando separación e inmutabilidad histórica. Después se retomará el siguiente gate del spike F3.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
