# ADR-015 — Versionado

**Estado:** Aprobada para MVP  
**Versión:** 2.0

## Contexto

El producto evoluciona en varias dimensiones que no deben confundirse: software, contratos, metodología de evaluación, catálogo de criterios, reglas de decisión, evaluadores de IA y ejecuciones históricas. Conservar únicamente la versión del código no permite reconstruir de forma fiable por qué un resultado fue interpretado de determinada manera.

## Decisión

Se adopta un esquema de versionado por capas:

1. **Producto/software:** Semantic Versioning (SemVer) en `package.json`, con releases etiquetados `vMAJOR.MINOR.PATCH`.
2. **Ejecución:** cada ejecución tendrá un identificador único e inmutable (`run_id`/`execution_id`) y conservará la versión del producto utilizada durante su ejecución.
3. **Escenario:** cada escenario mantiene su propia versión entera; una ejecución referencia explícitamente la versión ejecutada.
4. **Catálogo de criterios:** tendrá una versión independiente cuando sea utilizado por una evaluación.
5. **Modelo de evaluación:** tendrá una versión independiente cuando determine la interpretación de resultados.
6. **Reglas de decisión/agregación:** tendrán una versión independiente cuando se apliquen.
7. **Evaluador de IA:** tendrá versión/modelo/configuración identificable cuando participe en la evaluación.
8. **API:** se versionará explícitamente únicamente cuando exista un contrato API expuesto; los cambios incompatibles requerirán una versión mayor del contrato.
9. **Proveniencia:** el commit/revisión de Git que produjo el artefacto complementa la versión SemVer; no la sustituye.

Las versiones metodológicas son referencias históricas, no valores recalculados desde la configuración actual. Un resultado persistido debe conservar las versiones que determinaron su interpretación.

## Regla de inmutabilidad histórica

Una ejecución o resultado histórico no se reinterpreta automáticamente cuando cambian el producto, criterios, reglas o evaluador. Un nuevo comportamiento genera una nueva ejecución y conserva sus propias referencias de versión.

## SemVer para el producto

Mientras el producto permanezca en `0.x`, se considera API interna/inestable y las decisiones pueden evolucionar sin compromiso de compatibilidad pública. Al establecerse el contrato MVP estable se podrá promover a `1.0.0`.

- **MAJOR:** cambio incompatible del contrato estable.
- **MINOR:** funcionalidad compatible con el contrato existente.
- **PATCH:** corrección compatible sin cambio intencional del contrato.
- **Pre-release:** solo cuando sea necesario distinguir una versión previa a una release estable.

No se utilizará el número de versión del producto para representar cambios metodológicos. Las metodologías evolucionan con sus propios identificadores/versiones.

## Criterios de validación

1. Una ejecución histórica puede reconstruir qué versión de software y escenario utilizó.
2. Una evaluación histórica puede asociarse a las versiones de criterios, modelo y reglas que determinaron su interpretación.
3. Un cambio metodológico no altera silenciosamente resultados históricos.
4. Los cambios incompatibles de un API son detectables mediante su estrategia de versionado.
5. Los artefactos CI identifican el commit/revisión que los produjo.
6. El versionado no depende de información almacenada únicamente en logs.
7. Una nueva versión de software no obliga a cambiar las versiones metodológicas si la metodología no cambió.

## Implementación por etapas

- **Etapa 1:** SemVer del producto + trazabilidad por `execution_id` y versión de escenario.
- **Etapa 2:** snapshot de versión de software en la ejecución/evidencia persistida.
- **Etapa 3:** snapshot de versiones metodológicas al producir `ScenarioResult`/evaluación.
- **Etapa 4:** versionado explícito de contrato API cuando se exponga.

No se implementará todavía un registro central complejo de versiones ni un motor de migración de resultados históricos; se incorporarán cuando exista la necesidad funcional demostrada.

## Consecuencias

La plataforma separa claramente la evolución del software de la evolución de la metodología. Esto evita mezclar SemVer con versiones de criterios/reglas y permite auditar una ejecución histórica sin depender de la configuración vigente.
