# F2-22 — Validación metodológica de versionado

**Estado:** VALIDADO COMO ESTRATEGIA MVP
**Versión del documento:** 1.0

## Propósito

Validar una estrategia de versionado que permita distinguir la evolución del software de la evolución de la metodología de evaluación y conservar trazabilidad histórica por ejecución.

## Hipótesis

Un único número de versión de aplicación no es suficiente para reproducir la interpretación de un resultado. El sistema necesita un ancla histórica de ejecución y referencias independientes para escenario, criterios, modelo de evaluación, reglas y evaluador de IA.

## Decisión validada

- Producto/software: SemVer en `package.json` y releases `vMAJOR.MINOR.PATCH`.
- Ejecución: identificador único e inmutable como ancla histórica.
- Escenario: versión propia y explícita por ejecución.
- Metodología: versiones independientes para catálogo de criterios, modelo de evaluación y reglas.
- Evaluador IA: versión/configuración identificable cuando participe.
- API: versionado independiente cuando exista contrato expuesto.
- Git: commit/revisión como proveniencia complementaria del release.

## Casos validados

| ID | Propiedad | Resultado |
|---|---|---|
| VER-V01 | Producto expresable con SemVer | PASS |
| VER-V02 | Escenario independiente de producto | PASS |
| VER-V03 | Metodología independiente de software | PASS |
| VER-V04 | Cambio metodológico no reescribe snapshot histórico | PASS |
| VER-V05 | Ejecución identificable como ancla histórica | PASS |
| VER-V06 | Mismo software puede ejecutar metodologías distintas | PASS |
| VER-V07 | API puede permanecer sin versión hasta existir contrato público | PASS |

## Regla histórica

Los resultados no se recalculan silenciosamente con la configuración vigente. Una evaluación realizada con una versión metodológica conserva esas referencias. Si se necesita reinterpretar evidencia con una metodología nueva, se genera una nueva evaluación/ejecución trazable.

## Alcance de esta validación

Esta validación no implementa todavía un registro central de versiones ni modifica el modelo persistente de resultados. Valida el contrato conceptual para que la implementación posterior no mezcle SemVer con versiones metodológicas.

## Próxima implementación

La primera implementación productiva debe capturar la versión del producto en el contexto de ejecución/evidencia. Posteriormente, cuando exista evaluación persistente, se incorporarán las versiones del catálogo, modelo, reglas y evaluador al resultado.

## Criterio de salida

La estrategia se considera metodológicamente validada porque separa responsabilidades de versionado, preserva el contexto histórico y evita depender de logs para reconstruir una ejecución.
