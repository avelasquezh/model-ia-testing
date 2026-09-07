# F2-23 — Invariantes del contexto de versionado metodológico

**Estado:** PROPUESTO PARA VALIDACIÓN

## Objetivo

Cerrar el incremento de versionado definiendo las invariantes que una ejecución nueva debe cumplir para ser históricamente reconstruible.

## Decisión

Una ejecución nueva debe recibir un `EvaluationVersionContext` explícito antes de ser persistida. El contexto debe identificar, como mínimo, la versión del producto, la versión del método de evaluación, la versión del catálogo de criterios, la versión de las reglas de decisión y el identificador de ejecución.

Las referencias metodológicas son independientes entre sí, pero deben representar el conjunto exacto utilizado por la ejecución. Cambiar cualquiera de ellas implica un contexto metodológico distinto y no debe modificar ejecuciones existentes.

`legacy-unknown` queda reservado para registros históricos que realmente carecen de información de versionado; no puede utilizarse como sustituto silencioso de una referencia requerida en una ejecución nueva.

## Invariantes

1. Las referencias obligatorias no pueden ser vacías.
2. El contexto de una ejecución es inmutable después de su construcción.
3. Dos ejecuciones independientes pueden utilizar versiones diferentes sin compartir accidentalmente referencias mutables.
4. La recuperación desde PostgreSQL debe reconstruir el mismo contexto que fue persistido.
5. Una ejecución nueva no puede depender de normalización legacy para completar su contexto.
6. La versión de producto no se incrementa por cada commit; el commit identifica procedencia técnica y no sustituye las versiones metodológicas.

## Alcance

Este incremento no introduce scoring, pesos, agregación estadística ni una taxonomía definitiva de criterios. Su propósito es cerrar la frontera de identidad histórica antes de continuar con la definición metodológica del MVP.

## Criterio de salida

El incremento queda aprobado únicamente cuando las pruebas unitarias, integración PostgreSQL, BDD y quality gate de CI demuestren estas invariantes y el estado del proyecto se actualice con evidencia verificable.
