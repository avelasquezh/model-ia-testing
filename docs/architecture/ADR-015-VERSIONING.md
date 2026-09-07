# ADR-015 — Versionado

**Estado:** Aprobado como baseline de diseño; implementación incremental en curso  
**Versión:** 1.2

## Contexto

El producto tiene versiones de código, contratos, criterios de evaluación, reglas, artefactos y potencialmente modelos de IA. Para auditoría no es suficiente conocer únicamente la versión de la aplicación.

## Decisión

Se distinguen explícitamente:

- versión del producto/código;
- versión del contrato API cuando aplique;
- versión del método de evaluación;
- versión del catálogo de criterios;
- versión de reglas de decisión/agregación;
- versión del evaluador de IA cuando participe;
- identificador único e inmutable de cada ejecución;
- commit/revisión de procedencia técnica.

El producto utiliza Semantic Versioning como convención de releases. La versión de producto no aumenta por cada commit: cambia cuando existe un release que justifique el incremento.

Las versiones metodológicas evolucionan independientemente del producto. Un cambio metodológico no debe alterar silenciosamente la interpretación de resultados históricos.

Para representar el conjunto de referencias que contextualiza una evaluación se utiliza el contrato de dominio `EvaluationVersionContext`. El dominio no conoce Git, variables de entorno ni proveedores externos; las referencias llegan resueltas desde composición/configuración.

### Contrato mínimo

Una ejecución deberá poder identificar como mínimo:

`productVersion + evaluationMethodVersion + criterionCatalogVersion + decisionRulesVersion + executionId`

Cuando corresponda se añaden:

`evaluatorVersion + commitSha`

La versión del escenario continúa siendo una propiedad propia del escenario/ejecución y no se sustituye por el catálogo de criterios.

## Persistencia

Las referencias de versionado se almacenan como campos de primera clase en `executions`, junto con el estado y el resto del contexto histórico. La migración `003_execution_versioning.sql` hace obligatorias las cuatro referencias mínimas.

Las ejecuciones existentes sin referencias metodológicas se normalizan durante la migración como `legacy-unknown`. Esto representa explícitamente que la información histórica no estaba disponible y evita inventar una versión metodológica retrospectiva.

## Principios y patrones

- Semantic Versioning para releases del producto.
- Immutable Run Reference para identificar una ejecución histórica.
- Configuration/Method Versioning para metodología y reglas.
- Traceability by Identifier para reconstrucción histórica.
- Fail-fast ante referencias obligatorias ausentes o vacías.

## Criterios de validación

1. Una ejecución histórica puede reconstruir qué versiones metodológicas determinaron su interpretación.
2. Un cambio metodológico no modifica retrospectivamente resultados históricos.
3. Los cambios incompatibles del API son detectables mediante su estrategia de contrato.
4. Los artefactos CI identifican la revisión de código que los produjo.
5. El versionado no depende de información almacenada únicamente en logs.
6. El contrato de versión rechaza referencias obligatorias vacías.
7. El contexto de versión permanece inmutable después de su construcción.
8. Una ejecución persistida puede recuperarse con el mismo contexto de versión que tenía al ejecutarse.

## Estado de implementación

- [x] Decisión conceptual de separación de versiones.
- [x] Convención SemVer para producto.
- [x] Contrato de dominio `EvaluationVersionContext` creado.
- [x] Pruebas unitarias del contrato creadas.
- [x] Integración obligatoria del contexto en `Execution`.
- [x] Propagación del contexto desde `ExecuteScenario` y `ExecuteSuite`.
- [x] Migración PostgreSQL para persistencia de referencias.
- [x] Adaptador PostgreSQL de `ExecutionRepository`.
- [x] Pruebas unitarias de mapeo y recuperación.
- [x] Prueba de integración de round-trip PostgreSQL.
- [ ] Validación completa del comportamiento histórico con escenarios/versiones metodológicas reales.

## Consecuencia

La integración en `Execution` es intencional: la ejecución debe conservar el contexto que determina su interpretación. La persistencia se implementa de forma incremental para mantener separadas las responsabilidades de dominio, aplicación e infraestructura.
