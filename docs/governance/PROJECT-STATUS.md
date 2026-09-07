# Estado actual del proyecto — model-ia-testing

**Fecha:** 2026-09-07
**Versión de producto declarada:** 0.1.0
**Rama:** main
**Estado global:** MVP en implementación incremental; F1 ampliamente materializado, F2 con baseline ejecutable y F3 en validación técnica.

## Estado comprobado

### Frente 1 — Núcleo funcional
**Estado:** Implementado en gran parte y cubierto por pruebas.

Ya existen en el repositorio capacidades para gestión de objetivos, escenarios y suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates. El desarrollo no debe describirse ya como “pendiente de implementación”.

### Frente 2 — Evaluación observable
**Estado:** Baseline ejecutable parcial.

Están implementados y probados contratos/modelos de medición, criterios y planes ejecutables, validaciones de riesgo, tratamiento de repetición, trazabilidad de evaluación asistida por IA, catálogo de evidencia y la primera regla determinista conectada a una ejecución tangible (`rule-exact-response-v1`).

Permanece pendiente la aprobación metodológica definitiva del catálogo, el modelo de agregación/scoring, pesos, tratamiento final de estados y la validación de criterios semánticos con casos controlados.

### Frente 3 — Arquitectura
**Estado:** Baseline arquitectónica implementada parcialmente; spike técnico en ejecución.

La solución utiliza TypeScript estricto, monolito modular, arquitectura hexagonal, Playwright aislado mediante puertos/adaptadores, GitHub Actions y PostgreSQL con migraciones reproducibles. Esto demuestra materialización de decisiones, pero no equivale todavía a una aprobación completa del spike.

### Persistencia
**Estado:** Incremento técnico completado en CI.

El repositorio ya dispone de frontera PostgreSQL, esquema MVP reproducible, bookkeeping de migraciones, runner determinista y validaciones de migración/transacción en CI.

## Versionado

La versión de producto se mantiene en `0.1.0` hasta que exista un release que justifique un cambio SemVer.

Las versiones metodológicas no se derivan automáticamente de la versión del producto. Una ejecución histórica deberá poder asociarse a las versiones de producto, criterios, reglas y evaluador IA que determinaron su interpretación, además de su identificador de ejecución y procedencia técnica.

## Próximo incremento

Formalizar el contexto de versionado de ejecución como contrato de dominio y conectarlo progresivamente al agregado `Execution`, sin introducir todavía scoring global ni una plataforma distribuida.

## Regla de documentación

Cada incremento o corrección debe actualizar este documento con el estado verificable resultante. Nunca se marcará como “implementado”, “validado” o “completo” un componente cuya evidencia disponible solo demuestre que fue diseñado.
