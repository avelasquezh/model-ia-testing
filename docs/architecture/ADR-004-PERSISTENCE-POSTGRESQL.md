# ADR-004 — Persistencia relacional con PostgreSQL

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05
**Decisores:** Proyecto model-ia-testing

## Contexto

El sistema debe conservar objetivos, escenarios versionados, ejecuciones, pasos, observaciones, evidencias, resultados, hallazgos y reportes de forma trazable. La relación entre estos elementos es estructural y debe permitir reconstruir el origen de un resultado.

## Decisión propuesta

Adoptar **PostgreSQL** como motor de persistencia principal del MVP.

La persistencia deberá estar aislada mediante puertos/repositorios definidos por la aplicación o el dominio. El dominio no deberá depender de SQL, PostgreSQL ni de un ORM específico.

Las migraciones de esquema serán versionadas y ejecutables de forma reproducible en desarrollo, CI y despliegue.

## Justificación

El modelo de información presenta relaciones claras entre entidades y requiere integridad referencial, transacciones, consultas de trazabilidad y evolución controlada del esquema. PostgreSQL resulta adecuado para estas necesidades sin introducir la complejidad operacional de una solución distribuida.

## Alternativas consideradas

### SQLite

Adecuado para prototipos y pruebas locales, pero menos apropiado como persistencia principal del producto cuando se requieren concurrencia, evolución y operación multiusuario.

### MongoDB

Podría representar documentos de ejecución con flexibilidad, pero no aporta una ventaja suficiente para el núcleo altamente relacional y trazable del MVP.

### Almacenamiento de archivos como fuente principal

Simple para artefactos, pero insuficiente para relaciones, consultas y consistencia de las entidades del sistema.

## Decisiones complementarias

PostgreSQL almacenará metadatos y datos estructurados. La evidencia binaria de gran tamaño no se considerará automáticamente responsabilidad de PostgreSQL; su estrategia de almacenamiento será definida en un ADR específico.

Las transacciones se utilizarán cuando una operación de aplicación requiera atomicidad entre cambios relacionados.

## Consecuencias positivas

- Integridad referencial.
- Consultas de trazabilidad.
- Transacciones.
- Migraciones versionadas.
- Adecuación al modelo relacional del MVP.
- Compatibilidad con contenedores y CI.

## Consecuencias negativas

- Requiere administración del esquema y migraciones.
- Deben diseñarse índices y políticas de retención para ejecuciones y evidencia.
- El crecimiento de evidencia puede exigir almacenamiento separado.

## Patrones y principios afectados

- Repository: encapsulación del acceso a persistencia cuando el agregado lo justifique.
- Dependency Inversion: el dominio no conoce PostgreSQL.
- Unit of Work/Transaction boundary: candidato para casos de uso que requieran atomicidad; deberá justificarse antes de implementarse.
- Single Responsibility: persistencia separada de reglas de negocio.

## Criterios de validación

La decisión deberá validarse mediante un spike que demuestre:

1. creación reproducible del esquema desde cero;
2. ejecución de migraciones en CI;
3. persistencia y recuperación de una ejecución con trazabilidad completa;
4. rollback o estrategia equivalente ante fallo transaccional;
5. pruebas de repositorio separadas de las pruebas unitarias de dominio.

## Estado

**Propuesta.** La estrategia de evidencia binaria, migraciones y retención requiere decisiones complementarias antes de implementación definitiva.
