# ADR-007 — Estrategia de almacenamiento de evidencia

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05

## Contexto

La evidencia es parte fundamental de la auditabilidad. El modelo F2 exige conservar contexto suficiente para reconstruir resultados, incluyendo transcript, DOM, screenshots, timings, interacción y metadatos.

## Decisión propuesta

Separar **metadatos de evidencia** y **contenido binario**.

PostgreSQL conservará la identidad, relación, tipo, timestamp, origen, referencia, integridad y metadatos de cada evidencia. Los artefactos binarios podrán almacenarse en un almacenamiento de objetos o filesystem controlado mediante un puerto de almacenamiento.

El dominio no conocerá la ubicación física del archivo.

## Integridad

Cada artefacto deberá disponer de una referencia estable y, cuando corresponda, un hash criptográfico del contenido. La integridad deberá poder verificarse posteriormente.

## Retención

La política de retención será configurable y deberá diferenciar datos estructurados de artefactos pesados. No se eliminará evidencia necesaria para reconstruir un reporte sin una política explícita.

## Alternativas

### Todo en PostgreSQL

Simplifica la arquitectura inicial, pero puede aumentar innecesariamente el tamaño de la base de datos por screenshots, vídeos o DOM extensos.

### Todo en filesystem sin metadatos relacionales

Simplifica almacenamiento pero debilita consultas, trazabilidad e integridad referencial.

## Patrones

- Repository para metadatos.
- Adapter para almacenamiento físico.
- Content-addressable/integrity reference como estrategia técnica candidata, sin imponerla donde no aporte valor.

## Criterios de validación

1. Una evidencia puede localizarse desde una ejecución.
2. Una evidencia puede relacionarse con escenario, paso y resultado.
3. El contenido puede verificarse mediante su referencia de integridad.
4. La base de datos puede reconstruir la trazabilidad aunque el almacenamiento físico cambie.
5. La estrategia funciona en desarrollo y CI.

## Estado

**Propuesta.** La tecnología concreta de almacenamiento binario se decidirá después de evaluar volumen, costo, operación y despliegue del MVP.
