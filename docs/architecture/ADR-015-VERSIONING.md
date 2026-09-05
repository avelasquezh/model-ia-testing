# ADR-015 — Versionado

**Estado:** Propuesta para aprobación  
**Versión:** 1.0

## Contexto

El producto tendrá versiones de código, contratos, criterios de evaluación, reglas, artefactos y potencialmente modelos de IA. Para auditoría no es suficiente conocer únicamente la versión de la aplicación.

## Decisión

Se distinguirán al menos:

- versión del producto/código;
- versión del contrato API cuando aplique;
- versión del modelo de evaluación;
- versión del catálogo de criterios;
- versión de reglas de decisión/agregación;
- versión del evaluador de IA cuando participe;
- identificador único de cada ejecución.

Los cambios incompatibles de contratos deberán utilizar una estrategia explícita de versionado. Para el producto se evaluará Semantic Versioning como convención inicial.

Cada resultado persistido deberá poder asociarse a las versiones metodológicas que determinaron su interpretación.

## Principios y patrones

- Semantic Versioning como candidato para releases.
- Immutable Run Reference para identificar una ejecución histórica.
- Configuration/Method Versioning.
- Traceability by Identifier.

## Criterios de validación

1. Una ejecución histórica puede reconstruir qué reglas y criterios fueron utilizados.
2. Un cambio metodológico no altera silenciosamente resultados históricos.
3. Los cambios incompatibles del API son detectables.
4. Los artefactos CI identifican el commit/revisión que los produjo.
5. El versionado no depende de información almacenada únicamente en logs.

## Consecuencia

La plataforma podrá diferenciar evolución del software de evolución de la metodología de evaluación y mantener resultados auditables a lo largo del tiempo.
