# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — validación de aislamiento de versionado histórico

**Estado:** nueva prueba de integración implementada; ejecución CI del incremento pendiente de conclusión.

La corrección anterior quedó validada: el CI `34088059883` y el `Architecture Spike` `34088059889`, ambos sobre `d1e7abbc`, terminaron en **success**. El pipeline general ya levanta PostgreSQL, aplica las migraciones antes de ejecutar `npm test` y mantiene la integración PostgreSQL dentro de un entorno reproducible.

Sobre esa base se añadió una tercera prueba de integración en `spike/persistence/PostgresExecutionVersioning.integration.test.ts` para validar explícitamente dos ejecuciones independientes con contextos metodológicos distintos. La prueba comprueba que cada ejecución recupera su propio `EvaluationVersionContext` y que ambos contextos permanecen separados.

## Verificación observada

- CI `34088059883`, commit `d1e7abbc`: **success**.
- Architecture Spike `34088059889`, commit `d1e7abbc`: **success**.
- TypeScript: **success** en el CI validado.
- Integración PostgreSQL, migraciones, BDD y Playwright: **success** en el spike validado.
- Nueva prueba de aislamiento histórico: implementada en `8ca306c5`; nueva ejecución pendiente de conclusión observable.
- No se declara verde el nuevo incremento hasta observar sus gates en Actions.

## Persistencia y versionado

Las referencias mínimas de versionado continúan persistidas como campos de primera clase en `executions` mediante `003_execution_versioning.sql`. `PostgresExecutionRepository` reconstruye el `EvaluationVersionContext` al recuperar una ejecución. Las actualizaciones de estado no sustituyen esas referencias. La prueba existente también verifica que actualizar una ejecución no reemplaza sus referencias históricas.

La nueva prueba amplía la garantía: ejecuciones independientes pueden coexistir con contextos metodológicos diferentes sin contaminación entre ellas.

El valor `legacy-unknown` se utiliza únicamente cuando la información histórica realmente no existía; no representa una versión metodológica válida.

## Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Existen capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates.

## Frente 2 — Evaluación observable
**Estado:** Baseline ejecutable parcial.

Existen modelos de medición, criterios y planes ejecutables, validaciones de riesgo, repetición, trazabilidad de evaluación asistida por IA, catálogo de evidencia y una regla determinista conectada a una ejecución tangible.

Continúan pendientes la aprobación metodológica definitiva, scoring/agregación, pesos, tratamiento final de estados y validación de criterios semánticos con casos controlados.

## Frente 3 — Arquitectura
**Estado:** Baseline materializada parcialmente; integración PostgreSQL y pipeline técnico validados.

La solución ya materializa TypeScript estricto, monolito modular, arquitectura hexagonal, Playwright mediante adaptadores, GitHub Actions y PostgreSQL con migraciones reproducibles. La validación de aislamiento de contextos metodológicos es el incremento técnico activo.

## Persistencia
**Estado:** Schema MVP reproducible, repositorio PostgreSQL de `Execution`, migraciones y pruebas de versionado implementados. Integración PostgreSQL validada; aislamiento entre ejecuciones independientes pendiente de verificar en Actions.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Verificar las ejecuciones provocadas por `8ca306c5`. Con los gates en verde, cerrar la validación de aislamiento histórico y avanzar al siguiente gate técnico de F3, evitando introducir nueva funcionalidad hasta consolidar esta evidencia.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
