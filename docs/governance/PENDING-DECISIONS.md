# Registro de decisiones pendientes

Este registro distingue decisiones metodológicas aún no aprobadas de decisiones arquitectónicas documentadas como baseline o pendientes de validación.

## Metodología de evaluación

- Validar dimensiones y criterios definitivos del Frente 2 mediante casos reales/controlados. **Pendiente; el contrato ejecutable ya establece las invariantes estructurales.**
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

## Arquitectura — estado actual

Las decisiones arquitectónicas documentadas como ADR pueden pasar a estado validado únicamente cuando existe evidencia suficiente. A 2026-09-07, varias decisiones ya están materializadas y el spike F3 está VALIDADO.

- ADR-003 — Stack tecnológico: **baseline materializada; validación integral pendiente**.
- ADR-004 — Persistencia PostgreSQL: **baseline materializada; migraciones y repositorio de Execution implementados; validación operacional integral pendiente**.
- ADR-005 — Modelo de ejecución: **baseline materializada**.
- ADR-006 — Estrategia BDD/TDD: **materializada en pruebas existentes; validación integral pendiente**.
- ADR-007 — Almacenamiento de evidencia: **materializado parcialmente**.
- ADR-008 — Aislamiento Playwright: **materializado parcialmente**.
- ADR-009 — Evaluador IA: **contratos y trazabilidad parcialmente materializados; integración real pendiente**.
- ADR-010 — CI/CD y Quality Gates: **materializado en workflows**.
- ADR-011 — API y contratos: **pendiente de validación de la interfaz externa**.
- ADR-012 — Autenticación y autorización: **política definida; implementación pública pendiente**.
- ADR-013 — Observabilidad: **baseline parcial**.
- ADR-014 — Configuración y secretos: **baseline definida; validación completa pendiente**.
- ADR-015 — Versionado: **baseline aprobada; contexto integrado en Execution y persistido; validación histórica integral pendiente**.
- ADR-016 — Estructura modular: **baseline materializada parcialmente; validación estática integral pendiente**.
- ADR-017 — SDLC seguro y flujo Git: **política definida; controles operativos completos pendientes**.

## Validación técnica pendiente

F3 ya está validado mediante el Architecture Spike `34089149510`. El trabajo metodológico de F2 ya no está bloqueado por arquitectura y continúa con contratos y casos controlados.

## Automatización

- Seleccionar POM, Screenplay u otra abstracción de UI únicamente si el spike demuestra beneficio real.
- Definir detalles de fixtures y test doubles.
- Definir estrategia de datos de prueba.

## CI/CD

- Definir artefactos concretos de evidencia y retención.
- Definir política operativa de ramas/PR y protección de `main`.
- Seleccionar herramientas concretas para SAST, secret scanning y análisis de dependencias.

## Próximo punto de decisión

Validar en CI el contrato metodológico introducido en F2-22 y después comprobar, mediante casos controlados, qué dimensiones y criterios candidatos son realmente reproducibles y observables. El scoring global continúa explícitamente bloqueado hasta cerrar esas decisiones.

Ninguna decisión marcada como Pendiente deberá considerarse aprobada por defecto durante la implementación.
