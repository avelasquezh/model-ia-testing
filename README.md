# model-ia-testing

Plataforma para automatizar pruebas de calidad observable sobre sistemas conversacionales.

## Estado actual

**Versión de producto:** `0.1.0`  
**Estado:** MVP en implementación incremental. F1 está ampliamente materializado; F2 dispone de una baseline ejecutable y extensiones validadas; el frente activo del MVP es la capacidad de descubrir e interactuar con chatbots sobre URLs públicas mediante Adaptive Discovery.  
**Estado detallado:** [PROJECT-STATUS.md](docs/governance/PROJECT-STATUS.md)  
**Continuidad entre agentes:** [AGENT-HANDOFF.md](docs/governance/AGENT-HANDOFF.md)

El repositorio contiene implementación real de dominio, aplicación, adaptadores, Playwright, evidencia, evaluación inicial, persistencia PostgreSQL y CI/CD. La arquitectura y el CI no deben confundirse con la validación funcional final del MVP.

## Objetivo del MVP

Construir una plataforma capaz de recibir una **URL pública arbitraria**, explorarla de forma adaptable, localizar una superficie conversacional real y verificar una interacción reproducible sin depender de locators específicos del sitio.

Flujo funcional objetivo:

`URL → descubrir chat → abrir chat → localizar composer → enviar "Hello" → confirmar envío → observar nueva respuesta → confirmar recepción → VERIFIED`

La IA puede interpretar evidencia, pero no sustituye la evidencia observable.

## Modelos de prueba

- **Legacy:** baseline determinista/heurística para comparación.
- **Adaptive:** modelo prioritario para sitios desconocidos. Explora Page/Frame, genera y puntúa candidatos, prueba rutas de apertura y reevalúa el DOM después de acciones.

Adaptive no debe convertirse en reglas específicas por sitio. Un launcher, formulario, buscador, registro o canal de soporte no se considera chatbot solo por su texto o apariencia.

## Criterio de éxito

`CHAT_SURFACE_FOUND` y `CANDIDATE_FOUND` son estados de discovery, no éxito funcional.

El MVP no se considera funcionalmente cerrado mientras una ejecución pública no demuestre send + receive y termine en `VERIFIED` con evidencia auditable. Un CI verde tampoco compensa `verifiedCount = 0`.

## Baseline comprobada

- **F1 — Núcleo funcional:** gestión de objetivos, escenarios/suites, ejecución, observaciones, evidencia, resultados, hallazgos, reportes, trazabilidad, seguridad de ejecución y quality gates implementados en distintos niveles.
- **F2 — Evaluación:** modelos de medición, criterios, planes ejecutables, reglas deterministas, catálogo de evidencia, riesgo y validaciones metodológicas; las extensiones posteriores están clasificadas y no alteran retrospectivamente F2-01…F2-35.
- **F3 — Arquitectura:** monolito modular con arquitectura hexagonal, TypeScript estricto, Playwright aislado por adaptadores, PostgreSQL y GitHub Actions; la arquitectura base está validada por los spikes registrados.
- **Adaptive Discovery:** batería automatizada y benchmark público operativos; la interacción pública todavía requiere alcanzar una conversación verificada de forma reproducible.

## Versionado

La versión de producto se mantiene en `0.1.0`. No se incrementará por cada commit. Los releases utilizarán SemVer cuando exista un cambio de producto que justifique una nueva versión.

Las versiones metodológicas se mantienen separadas de la versión del producto: método de evaluación, catálogo de criterios, reglas de decisión/agregación y evaluador IA. Cada ejecución deberá poder identificar el conjunto que determinó su interpretación, además de su `ExecutionId` y procedencia técnica.

## Trazabilidad

La cadena objetivo es:

`Requisito → Criterio de aceptación → Gherkin → Implementación → Prueba → CI → Evidencia → Resultado → Hallazgo → Reporte`

Para Adaptive, la cadena funcional prioritaria se amplía con la ruta observable:

`URL → candidato → apertura → composer → envío → respuesta nueva → VERIFIED → evidencia`

## Próximo trabajo

1. Llevar al menos una URL pública del corpus desde discovery hasta `VERIFIED`.
2. Eliminar falsos positivos de formularios, buscadores, registros y otras superficies no conversacionales.
3. Robustecer la detección de mensaje enviado y de **respuesta nueva posterior al envío**, incluida la operación en Page/Frame y widgets anidados.
4. Repetir la comparación Legacy vs Adaptive usando el mismo criterio funcional.

No desplazar este objetivo hacia scoring global, proveedores de IA u otros frentes que no sean necesarios para P0/P1.

## Documentación clave

- [Handoff operativo para agentes](docs/governance/AGENT-HANDOFF.md)
- [Estado del proyecto](docs/governance/PROJECT-STATUS.md)
- [Requisitos de Frente 1](docs/requirements/F1-REQUIREMENTS.md)
- [Backlog](docs/requirements/F1-BACKLOG.md)
- [Matriz de trazabilidad](docs/requirements/F1-TRACEABILITY.md)
- [Architecture baseline](docs/architecture/F3-ARCHITECTURE.md)
- [Technical spike](docs/architecture/F3-TECHNICAL-SPIKE.md)
- [Versionado](docs/architecture/ADR-015-VERSIONING.md)
- [Definition of Done](docs/governance/DEFINITION-OF-DONE.md)
- [Decisiones pendientes](docs/governance/PENDING-DECISIONS.md)
