# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — recuperación del gate TypeScript

**Estado:** correcciones implementadas; nuevo CI pendiente de conclusión.

El CI correspondiente al commit `906f6887` volvió a fallar en compilación TypeScript. La regresión quedó reducida a tres defectos concretos: un `commitSha` opcional enviado como `undefined` bajo `exactOptionalPropertyTypes`, un mock de PostgreSQL cuya firma no permitía inspeccionar el segundo argumento y una restauración del agregado que utilizaba el identificador importado solo como tipo en vez del alias de valor.

Las correcciones mantienen intacto el contrato de versionado: el BDD solo añade `commitSha` cuando existe, el mock declara explícitamente sus parámetros y `PostgresExecutionRepository` instancia `ExecutionModel` al reconstruir una ejecución.

Durante la corrección se produjo además una sustitución incompleta temporal del archivo `spike/bdd/architecture.steps.ts`; fue restaurado inmediatamente desde el estado versionado anterior y la corrección quedó aplicada sobre el archivo completo. No se considera una pérdida funcional persistente del repositorio.

## Verificación observada

- CI `34087002631`, commit `906f6887`: **fallido en TypeScript**.
- Error BDD `TS2379`: corregido.
- Error de tipado del mock `TS2352/TS2493`: corregido.
- Error de instancia `TS1361` en `PostgresExecutionRepository`: corregido.
- Nuevo CI tras estas correcciones: pendiente de conclusión observable.
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
**Estado:** Schema MVP reproducible y repositorio PostgreSQL de `Execution` implementados; el gate de CI de la corrección actual está pendiente.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Observar el nuevo CI y corregir cualquier regresión adicional. Con CI en verde, cerrar este incremento y validar dos ejecuciones independientes con contextos metodológicos distintos, verificando separación e inmutabilidad histórica. Después se retomará el siguiente gate del spike F3.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
