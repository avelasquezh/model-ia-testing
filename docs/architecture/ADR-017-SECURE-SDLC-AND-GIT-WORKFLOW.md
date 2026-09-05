# ADR-017 — SDLC seguro y flujo Git

**Estado:** Propuesta para aprobación  
**Versión:** 1.0

## Contexto

La auditabilidad del producto exige que los cambios de código, metodología y configuración sean revisables y que los controles de calidad se ejecuten de forma repetible.

## Decisión

El desarrollo seguirá un flujo basado en cambios pequeños, trazables y verificables. Los cambios relevantes deberán vincularse a un requisito, decisión, defecto o tarea identificable.

Cuando el repositorio evolucione hacia trabajo colaborativo, se priorizará:

- ramas de trabajo separadas de `main`;
- Pull Requests para cambios relevantes;
- revisión antes de integración;
- CI obligatorio antes de integración;
- commits con propósito identificable;
- protección de secretos;
- dependencias versionadas y auditables;
- controles de seguridad automatizables.

`main` representará un estado potencialmente desplegable y no deberá utilizarse como sustituto de una revisión de cambio cuando el proceso colaborativo ya esté establecido.

## Controles de seguridad candidatos

- secret scanning;
- dependency vulnerability scanning;
- SAST;
- análisis de dependencias y licencias según necesidad;
- revisión de permisos de GitHub Actions;
- versiones controladas de Actions;
- principio de mínimo privilegio para workflows.

La selección concreta de herramientas se realizará sin introducir controles que generen falsos bloqueos no justificados.

## Patrones/prácticas

- Secure SDLC.
- Trunk-based development o GitHub Flow como alternativas a validar según tamaño del equipo.
- Quality Gates.
- Code Review.
- Fail Fast.
- Least Privilege.

## Criterios de validación

1. Cada cambio relevante puede rastrearse hasta su motivo.
2. CI ejecuta controles antes de la integración cuando el flujo los requiera.
3. Los secretos no son aceptados como archivos versionados.
4. Las dependencias vulnerables críticas pueden bloquear el flujo según política definida.
5. Los artefactos de CI identifican commit y ejecución que los produjo.

## Consecuencia

El repositorio se convierte en una fuente auditable de evolución técnica y los controles de calidad dejan de depender exclusivamente de verificaciones manuales.
