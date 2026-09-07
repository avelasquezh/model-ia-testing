# model-ia-testing

Plataforma para automatizar pruebas de calidad observable sobre sistemas conversacionales.

## Estado actual

**Versión de producto:** `0.1.0`  
**Estado:** MVP en implementación incremental. F1 está ampliamente materializado; F2 dispone de una baseline ejecutable parcial; F3 está en validación mediante spike técnico.  
**Estado detallado:** [PROJECT-STATUS.md](docs/governance/PROJECT-STATUS.md)

El repositorio ya contiene implementación real de dominio, aplicación, adaptadores, Playwright, evidencia, evaluación inicial, persistencia PostgreSQL y CI/CD. Por tanto, la fase del proyecto no debe describirse como “solo diseño”. Tampoco debe considerarse todavía un MVP productivo o una arquitectura completamente validada.

## Objetivo

Construir una plataforma capaz de ejecutar pruebas reproducibles sobre sistemas conversacionales, recoger evidencia observable, evaluar esa evidencia mediante reglas explícitas y, cuando corresponda, asistencia de IA, y producir resultados auditables y trazables.

Principio central:

> La IA interpreta evidencia; no reemplaza evidencia.

## Baseline comprobada

- **F1 — Núcleo funcional:** gestión de objetivos, escenarios/suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates implementados en distintos niveles.
- **F2 — Evaluación:** modelos de medición, criterios, planes ejecutables, reglas deterministas, catálogo de evidencia, riesgo y validaciones metodológicas parciales.
- **F3 — Arquitectura:** monolito modular con arquitectura hexagonal, TypeScript estricto, Playwright aislado por adaptadores, PostgreSQL y GitHub Actions; el spike aún no ha cerrado todas sus validaciones.
- **Persistencia:** migraciones PostgreSQL reproducibles y verificaciones técnicas incorporadas al spike/CI.

## Versionado

La versión de producto se mantiene en `0.1.0`. No se incrementará por cada commit. Los releases utilizarán SemVer cuando exista un cambio de producto que justifique una nueva versión.

Las versiones metodológicas se mantienen separadas de la versión del producto: método de evaluación, catálogo de criterios, reglas de decisión/agregación y evaluador IA. Cada ejecución deberá poder identificar el conjunto que determinó su interpretación, además de su `ExecutionId` y procedencia técnica.

## Trazabilidad

La cadena objetivo es:

`Requisito → Criterio de aceptación → Gherkin → Implementación → Prueba → CI → Evidencia → Resultado → Hallazgo → Reporte`

## Próximo trabajo

1. Completar el contrato de contexto de versionado y conectarlo al ciclo de vida de `Execution`.
2. Ejecutar el spike técnico restante y convertir en decisión formal las evidencias obtenidas.
3. Continuar F2 sin introducir scoring global hasta cerrar la validación metodológica.
4. Reconciliar permanentemente documentación, implementación y evidencia CI.

## Documentación clave

- [Estado del proyecto](docs/governance/PROJECT-STATUS.md)
- [Requisitos de Frente 1](docs/requirements/F1-REQUIREMENTS.md)
- [Backlog](docs/requirements/F1-BACKLOG.md)
- [Matriz de trazabilidad](docs/requirements/F1-TRACEABILITY.md)
- [Architecture baseline](docs/architecture/F3-ARCHITECTURE.md)
- [Technical spike](docs/architecture/F3-TECHNICAL-SPIKE.md)
- [Versionado](docs/architecture/ADR-015-VERSIONING.md)
- [Definition of Done](docs/governance/DEFINITION-OF-DONE.md)
- [Decisiones pendientes](docs/governance/PENDING-DECISIONS.md)
