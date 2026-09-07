# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — corrección del contrato de versionado

**Estado:** corrección implementada; pendiente de nuevo resultado CI.

El primer CI posterior a la integración del contexto de versionado falló en compilación. La causa observada fue que el nuevo contrato de `Execution` rompió fixtures legacy y un step BDD que aún utilizaba el constructor anterior de `ExecuteScenario`. No se relajó la persistencia ni se eliminó el versionado del agregado.

La corrección normaliza explícitamente una ausencia de contexto en construcciones legacy a `legacy-unknown`, mientras que las ejecuciones nuevas creadas por `ExecuteScenario` siguen recibiendo un `EvaluationVersionContext` explícito. También se corrigió la preservación de `startedAt` durante `Execution.start()` y se actualizó la prueba de dominio correspondiente.

## Verificación observada

- CI del commit anterior: **fallido en TypeScript**.
- Causa principal: fixtures legacy sin `versionContext` y constructor BDD desactualizado.
- Corrección del constructor BDD: implementada.
- Compatibilidad legacy explícita: implementada y cubierta por prueba.
- Preservación de `startedAt`: corregida.
- Nuevo CI de la corrección: pendiente de conclusión observable.

## Persistencia y versionado

Las referencias mínimas de versionado continúan persistidas como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. `PostgresExecutionRepository` reconstruye el `EvaluationVersionContext` al recuperar una ejecución. Las actualizaciones de estado no sustituyen esas referencias.

El valor `legacy-unknown` se utiliza únicamente cuando la información histórica realmente no existía; no representa una versión metodológica válida.

## Corrección de documentación

README, `PROJECT-STATUS.md`, ADR-015 y `PENDING-DECISIONS.md` deben distinguir permanentemente entre diseño, implementación, regresiones detectadas y validación CI. La documentación no marcará un cambio como verde hasta observar la conclusión del workflow correspondiente.

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
**Estado:** Schema MVP reproducible y repositorio PostgreSQL de `Execution` implementados; el gate de CI de la corrección actual está pendiente.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Observar el nuevo CI y corregir cualquier regresión adicional. Con CI en verde, cerrar este incremento y continuar con la validación histórica de dos contextos metodológicos distintos sobre ejecuciones independientes. Después se retomará el siguiente gate del spike F3.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
