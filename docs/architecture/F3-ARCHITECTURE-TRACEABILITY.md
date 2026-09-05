# Frente 3 — Trazabilidad arquitectónica

**Versión:** 1.0  
**Estado:** Baseline

## Propósito

Relacionar decisiones arquitectónicas con las necesidades del producto y con los mecanismos que deberán validarlas. Esta matriz no sustituye la trazabilidad detallada de requisitos; la complementa.

## Matriz

| Necesidad / restricción | Decisión arquitectónica | ADR | Validación prevista |
|---|---|---|---|
| Independencia del dominio | Monolito modular + Hexagonal | F3 + ADR-016 | Test de dependencias + compilación |
| Automatización de navegador | Playwright detrás de puerto | ADR-003, ADR-008 | E2E + test con doble del puerto |
| Persistencia relacional y trazable | PostgreSQL mediante repositorios | ADR-004 | Migración + integración |
| Evidencia reproducible | Metadatos separados de contenido | ADR-007 | Test de captura/referencia/integridad |
| Evaluación determinista y asistida | Puerto de evaluación semántica | ADR-009 | Test determinista + adapter IA aislado |
| Comportamiento verificable | Gherkin + Cucumber | ADR-006 | Suite BDD en CI |
| Calidad automatizada del propio producto | Quality Gates | ADR-010 | Workflow GitHub Actions |
| Exposición mediante API | API como adaptador de entrada | ADR-011 | Contract/API tests |
| Protección de recursos | AuthN/AuthZ fuera del dominio | ADR-012 | Tests de autorización |
| Diagnóstico operacional | Observabilidad transversal | ADR-013 | Tests/log checks |
| Configuración segura | Configuración externa y tipada | ADR-014 | Tests de configuración + CI |
| Reconstrucción histórica | Versionado de código/metodología/ejecución | ADR-015 | Test de persistencia de versiones |
| Cambios controlados | Secure SDLC + Git workflow | ADR-017 | PR/CI/security checks |

## Reglas de interpretación

- Una fila indica una intención arquitectónica, no evidencia de implementación.
- Una propuesta de ADR no se considera validada hasta ejecutar su criterio correspondiente.
- Un test que comprueba un detalle de implementación no demuestra por sí solo la validez de la decisión arquitectónica.
- Toda desviación significativa deberá generar actualización del ADR afectado o un nuevo ADR.

## Estado global

**Arquitectura documental:** VALIDADA COMO BASELINE.  
**Arquitectura técnica:** PENDIENTE DE SPIKE.  
**Implementación productiva:** NO INICIADA.
