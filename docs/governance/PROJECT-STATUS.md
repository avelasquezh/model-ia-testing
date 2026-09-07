# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — recuperación del gate PostgreSQL

**Estado:** corrección de infraestructura de pruebas implementada; nuevo CI pendiente de conclusión.

Después de corregir TypeScript, el CI `34087212985` confirmó que el build ya pasaba y que 207 pruebas unitarias estaban verdes, pero tres pruebas PostgreSQL fallaban por `ECONNREFUSED` contra `localhost:5432`. El problema se produjo antes de llegar a migraciones y no fue un fallo del repositorio de ejecución.

La causa se aisló en el orden y preparación del spike: el conjunto general `npm test` incluía pruebas que requieren PostgreSQL antes del paso formal de migración y no existía un chequeo explícito de disponibilidad del servicio. Se ajustó el workflow para esperar PostgreSQL explícitamente, excluir las pruebas PostgreSQL del bloque general y ejecutarlas después de `db:migrate` con una URL explícita sobre `127.0.0.1`.

## Verificación observada

- CI `34087212985`, commit `d2408019`: **falló en pruebas**, no en TypeScript.
- TypeScript: **success**.
- Pruebas no PostgreSQL: **207 success**.
- Fallos PostgreSQL observados: **3**, todos `ECONNREFUSED` sobre `::1`/`127.0.0.1:5432`.
- Corrección del workflow: implementada en `b8c97ad6`.
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

La solución ya materializa TypeScript estricto, monolito modular, arquitectura hexagonal, Playwright mediante adaptadores, GitHub Actions y PostgreSQL con migraciones reproducibles. Esto no constituye por sí solo una validación completa del spike.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution` y pruebas de versionado implementados; validación CI de integración PostgreSQL pendiente.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Verificar el nuevo CI del spike y corregir cualquier problema de servicio o migración que aparezca. Con el gate PostgreSQL en verde, cerrar la recuperación y ejecutar la validación histórica de dos ejecuciones independientes con contextos metodológicos distintos, verificando separación e inmutabilidad histórica. Después se retomará el siguiente gate del spike F3.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
