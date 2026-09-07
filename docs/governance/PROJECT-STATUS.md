# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07  
**Versión de producto declarada:** `0.1.0`  
**Rama:** `main`  
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable parcial y F3 en validación técnica.

## Incremento actual — contexto de versionado en ejecución

**Estado:** implementado y cubierto por pruebas unitarias/aplicación.

`EvaluationVersionContext` identifica versión de producto, método de evaluación, catálogo de criterios y reglas de decisión, con referencias opcionales del evaluador IA y commit de procedencia. `ExecuteScenario` recibe este contexto como dependencia y cada `Execution` lo conserva obligatoriamente durante `PENDING` → `RUNNING` → estado terminal.

La persistencia de estas referencias en PostgreSQL todavía no está integrada. Por tanto, la reconstrucción histórica está soportada en dominio/aplicación, pero todavía no debe declararse como auditabilidad persistida completa.

## Corrección de documentación

README, `PROJECT-STATUS.md`, ADR-015 y `PENDING-DECISIONS.md` fueron reconciliados para distinguir entre diseño, implementación parcial y validación. El README ya no presenta el MVP como no iniciado.

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
**Estado:** Incremento técnico comprobado en CI.

Se dispone de frontera PostgreSQL, esquema reproducible, bookkeeping de migraciones, runner determinista y validaciones de migración/transacción en CI.

## Versionado

La versión de producto permanece en `0.1.0`. No se incrementará por cada commit.

Las versiones metodológicas son independientes del producto. Una ejecución histórica deberá poder reconstruir qué método, criterios, reglas y evaluador determinaron su interpretación, junto con la identidad de ejecución y procedencia técnica.

## Próximo incremento

Persistir las referencias del `EvaluationVersionContext` asociadas a `Execution` en PostgreSQL, con migración reproducible y pruebas de recuperación. Después se continuará con el siguiente gate del spike F3; el scoring global sigue deliberadamente fuera de alcance hasta cerrar su validación metodológica.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Los cambios de comportamiento deben incluir la actualización de estado en el mismo commit siempre que sea técnicamente viable.
