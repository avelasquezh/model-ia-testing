# Registro de decisiones pendientes

Este registro distingue decisiones metodológicas aún no aprobadas de decisiones arquitectónicas documentadas como propuestas y pendientes de validación.

## Metodología de evaluación

- Validar dimensiones y criterios definitivos del Frente 2 mediante casos reales/controlados.
- Definir tratamiento estadístico de repetición y variabilidad cuando exista evidencia suficiente.
- Definir límites de confianza/incertidumbre si las métricas lo requieren.
- Validar el rol de IA en criterios semánticos.

## Calificación

- Validar escala global 0–100 o mantener perfil de calidad observable.
- Validar pesos por dimensión.
- Validar tratamiento de criterios críticos.
- Validar efecto de INCONCLUSIVE y NOT_EVALUABLE.
- Validar sensibilidad a fallos críticos.
- Validar reproducibilidad y estabilidad del modelo de agregación.

## Arquitectura — propuestas documentadas

Los siguientes temas ya tienen ADR, pero permanecen como **Propuesta** hasta superar los criterios de validación correspondientes:

- ADR-003 — Stack tecnológico.
- ADR-004 — Persistencia PostgreSQL.
- ADR-005 — Modelo de ejecución.
- ADR-006 — Estrategia BDD/TDD.
- ADR-007 — Almacenamiento de evidencia.
- ADR-008 — Aislamiento Playwright.
- ADR-009 — Evaluador IA.
- ADR-010 — CI/CD y Quality Gates.
- ADR-011 — API y contratos.
- ADR-012 — Autenticación y autorización.
- ADR-013 — Observabilidad.
- ADR-014 — Configuración y secretos.
- ADR-015 — Versionado.
- ADR-016 — Estructura modular.
- ADR-017 — SDLC seguro y flujo Git.

## Validación técnica pendiente

El principal gate previo a implementación productiva es el **spike técnico de arquitectura** definido en `docs/architecture/F3-ARCHITECTURE.md`.

Debe demostrar, como mínimo:

- TypeScript estricto;
- separación de capas y módulos;
- pruebas unitarias/aplicación sin infraestructura;
- Gherkin + Cucumber;
- Playwright en interacción controlada;
- aislamiento/sustitución del browser adapter;
- PostgreSQL y migraciones reproducibles;
- evidencia trazable;
- GitHub Actions y quality gates;
- controles de dependencias arquitectónicas cuando sean viables.

El resultado del spike debe ser explícito: **VALIDADO**, **VALIDADO CON CAMBIOS** o **NO VALIDADO**.

## Automatización

- Seleccionar POM, Screenplay u otra abstracción de UI únicamente si el spike demuestra beneficio real.
- Definir detalles de fixtures y test doubles.
- Definir estrategia de datos de prueba.

## CI/CD

- Implementar workflows derivados de ADR-010.
- Definir artefactos concretos de evidencia y retención.
- Definir política operativa de ramas/PR y protección de `main`.
- Seleccionar herramientas concretas para SAST, secret scanning y análisis de dependencias.

Ninguna decisión marcada como Propuesta o Pendiente deberá considerarse aprobada por defecto durante la implementación.
