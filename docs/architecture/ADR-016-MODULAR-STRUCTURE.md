# ADR-016 — Estructura modular y reglas de dependencia

**Estado:** Propuesta para aprobación  
**Versión:** 1.0

## Contexto

La arquitectura hexagonal define responsabilidades, pero la implementación necesita límites físicos que eviten dependencias accidentales y permitan validar las reglas arquitectónicas automáticamente.

## Decisión

El código se organizará por módulos de negocio/capacidad, con separación explícita entre dominio, aplicación, adaptadores e infraestructura.

La estructura definitiva de directorios/package se validará durante el spike de implementación, pero deberá respetar estas reglas:

1. El dominio no importa infraestructura ni adaptadores.
2. Los casos de uso dependen de puertos, no de implementaciones concretas.
3. Los adaptadores pueden depender de aplicación/dominio según su contrato, pero no deben invertir la dirección arquitectónica.
4. La composición de dependencias ocurre fuera del dominio.
5. Las dependencias entre módulos deben ser explícitas y justificadas.
6. Un módulo no accede directamente a la persistencia interna de otro módulo.
7. Los DTO externos no se convierten en entidades de dominio por simple reutilización estructural.

## Regla arquitectónica verificable

Toda nueva dependencia entre capas o módulos deberá poder justificarse mediante el contrato que la necesita. Las reglas críticas de dependencia deberán validarse mediante tooling estático cuando sea viable.

## Patrones y principios

- Modular Monolith.
- Hexagonal Architecture.
- Dependency Inversion.
- Bounded Responsibility / Separation of Concerns.
- Encapsulation.
- Package-by-feature como candidato para organización funcional, combinado con límites de puertos/adaptadores cuando resulte más claro.

## Criterios de validación

1. El dominio compila sin dependencias de infraestructura.
2. Una prueba de dominio no requiere Playwright, PostgreSQL, HTTP ni proveedor de IA.
3. Las dependencias prohibidas pueden detectarse automáticamente.
4. Los módulos pueden probarse con dobles de prueba donde corresponda.
5. La composición de infraestructura está centralizada.

## Consecuencia

La estructura física del proyecto podrá evolucionar sin perder los límites arquitectónicos. Las reglas dejan de ser únicamente documentación y pasan a ser candidatos a controles automatizados.
