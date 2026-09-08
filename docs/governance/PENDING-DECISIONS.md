# Registro de decisiones pendientes

Este registro distingue decisiones metodológicas aún no aprobadas de decisiones arquitectónicas documentadas como baseline o pendientes de validación.

## Metodología de evaluación

- Validar dimensiones y criterios definitivos del Frente 2 mediante casos reales/controlados. **F2-41 cerrado: aptitud estructural demostrada; F2-42 cerrado: repetibilidad empírica demostrada sobre un doble conversacional controlado para D1, D6 y D7; F2-43 cerrado: retención de contexto conversacional demostrada metodológicamente sobre un doble controlado para D3-C01; F2-44 cerrado: contrato y protocolo controlado de evaluación semántica asistida por IA demostrado para D2-C01.**
- Definir tratamiento estadístico de repetición y variabilidad cuando exista evidencia suficiente.
- Definir límites de confianza/incertidumbre si las métricas lo requieren.
- **F2-44 cerrado a nivel de contrato y protocolo:** la validación usó un doble metodológico controlado; la validación de un proveedor/modelo de IA real continúa pendiente.
- **F2-45 cerrado a nivel de frontera arquitectónica:** `SemanticEvaluatorPort` y el desacoplamiento provider-neutral quedaron materializados y validados por CI/Architecture Spike.
- **F2-46 en ejecución:** adaptador real de Ollama materializado; falta ejecutar con un modelo local real y caracterizar reproducibilidad, variabilidad e insuficiencia de evidencia.
- D4 y D5 requieren protocolos empíricos específicos antes de considerarse validados.

## Calificación

- Validar escala global 0–100 o mantener perfil de calidad observable.
- Validar pesos por dimensión.
- Validar tratamiento de criterios críticos.
- Validar efecto de INCONCLUSIVE y NOT_EVALUABLE.
- Validar sensibilidad a fallos críticos.
- Validar reproducibilidad y estabilidad del modelo de agregación.

## Arquitectura — estado actual

Las decisiones arquitectónicas documentadas como ADR pueden pasar a estado validado únicamente cuando existe evidencia suficiente. A 2026-09-08, varias decisiones ya están materializadas y el spike F3 está VALIDADO.

- ADR-003 — Stack tecnológico: **baseline materializada; validación integral pendiente**.
- ADR-004 — Persistencia PostgreSQL: **baseline materializada; migraciones y repositorio de Execution implementados; validación operacional integral pendiente**.
- ADR-005 — Modelo de ejecución: **baseline materializada**.
- ADR-006 — Estrategia BDD/TDD: **materializada en pruebas existentes; validación integral pendiente**.
- ADR-007 — Almacenamiento de evidencia: **materializado parcialmente**.
- ADR-008 — Aislamiento Playwright: **materializado parcialmente**.
- ADR-009 — Evaluador IA: **contrato y trazabilidad base validados en F2-44; frontera provider-neutral validada en F2-45; adaptación Ollama materializada en F2-46; validación live con modelo real pendiente**.
- ADR-010 — CI/CD y Quality Gates: **materializado en workflows**.
- ADR-011 — API y contratos: **pendiente de validación de la interfaz externa**.
- ADR-012 — Autenticación y autorización: **política definida; implementación pública pendiente**.
- ADR-013 — Observabilidad: **baseline parcial**.
- ADR-014 — Configuración y secretos: **baseline definida; validación completa pendiente**.
- ADR-015 — Versionado: **baseline aprobada; contexto integrado en Execution y persistido; validación histórica integral pendiente**.
- ADR-016 — Estructura modular: **baseline materializada parcialmente; validación estática integral pendiente**.
- ADR-017 — SDLC seguro y flujo Git: **política definida; controles operativos completos pendientes**.

## Validación técnica pendiente

F3 ya está validado mediante el Architecture Spike `34089149510`. El trabajo metodológico de F2 ya no está bloqueado por arquitectura y continúa con protocolos específicos para criterios todavía no demostrados.

## Automatización

- Seleccionar POM, Screenplay u otra abstracción de UI únicamente si el spike demuestra beneficio real.
- Definir detalles de fixtures y test doubles.
- Definir estrategia de datos de prueba.

## CI/CD

- Definir artefactos concretos de evidencia y retención.
- Definir política operativa de ramas/PR y protección de `main`.
- Seleccionar herramientas concretas para SAST, secret scanning y análisis de dependencias.

## Próximo punto de decisión

Ejecutar F2-46 con un modelo real de Ollama mediante `OllamaSemanticEvaluator`. La validación debe demostrar conexión, normalización, trazabilidad y estabilidad bajo repetición, manteniendo la intención esperada predefinida y la evidencia primaria. La selección de Ollama como primer proveedor de prueba no congela el proveedor futuro.

El scoring global continúa explícitamente bloqueado.

Ninguna decisión marcada como Pendiente deberá considerarse aprobada por defecto durante la implementación.
