# Registro de decisiones pendientes

Este registro distingue decisiones metodológicas aún no aprobadas de decisiones arquitectónicas documentadas como baseline o pendientes de validación.

## Gobierno de la secuencia F2

La baseline oficial del MVP de Frente 2 comprende exactamente **F2-01 a F2-35**. El documento normativo es `docs/evaluation/F2-INCREMENT-BASELINE.md`.

Los identificadores **F2-36 a F2-46 no forman parte de la secuencia oficial del MVP**. Se conservan como nombres históricos de artefactos ya materializados para no perder trazabilidad, pero desde esta fecha se clasifican así:

| Identificador histórico | Clasificación canónica | Contenido |
|---|---|---|
| F2-36 | `F2-EXT-01` | Interpretación de cobertura por ejecución |
| F2-37 | `F2-EXT-02` | Métricas descriptivas de cobertura por ejecución |
| F2-38 | `F2-EXT-03` | Comparabilidad metodológica entre ejecuciones |
| F2-39 | `F2-EXT-04` | Comparación descriptiva de métricas de cobertura |
| F2-40 | `F2-EXT-05` | Interpretación descriptiva de diferencias entre ejecuciones |
| F2-41 | `F2-VAL-01` | Validación controlada de dimensiones y criterios candidatos |
| F2-42 | `F2-VAL-02` | Validación empírica controlada de criterios seleccionados |
| F2-43 | `F2-VAL-03` | Validación empírica de retención de contexto |
| F2-44 | `F2-VAL-04` | Validación controlada del protocolo de evaluación semántica asistida por IA |
| F2-45 | `F2-EXT-06` | Frontera provider-neutral para evaluador semántico IA |
| F2-46 | `F2-EXT-07` | Adaptación Ollama, **retirada / no adoptada** |

Esta clasificación **no renumera ni modifica retrospectivamente F2-01 a F2-35**. Los nombres históricos permanecen por trazabilidad de Git, pero no deben utilizarse para definir el próximo incremento del MVP.

Ninguna extensión posterior se considerará automáticamente parte de F2. Cualquier nuevo trabajo deberá registrarse como `F2-EXT-*`, `F2-VAL-*` o como evolución metodológica explícita de un incremento existente.

## Metodología de evaluación

- Validar dimensiones y criterios definitivos del Frente 2 mediante casos reales/controlados. **F2-41 cerrado: aptitud estructural demostrada; F2-42 cerrado: repetibilidad empírica demostrada sobre un doble conversacional controlado para D1, D6 y D7; F2-43 cerrado: retención de contexto conversacional demostrada metodológicamente sobre un doble controlado para D3-C01; F2-44 cerrado: contrato y protocolo controlado de evaluación semántica asistida por IA demostrado para D2-C01.**
- Definir tratamiento estadístico de repetición y variabilidad cuando exista evidencia suficiente.
- Definir límites de confianza/incertidumbre si las métricas lo requieren.
- **F2-44 cerrado a nivel de contrato y protocolo:** la validación usó un doble metodológico controlado; la validación de un proveedor/modelo de IA real continúa pendiente.
- **F2-45 / F2-EXT-06 cerrado a nivel de frontera arquitectónica:** `SemanticEvaluatorPort` y el desacoplamiento provider-neutral quedaron materializados y validados por CI/Architecture Spike.
- **F2-46 / F2-EXT-07 retirado:** Ollama no forma parte del alcance activo y no se realizará validación live con ese proveedor.
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
- ADR-009 — Evaluador IA: **contrato y trazabilidad base validados en F2-44; frontera provider-neutral validada en F2-EXT-06; ningún proveedor concreto adoptado**.
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

El siguiente trabajo debe partir de `F2-INCREMENT-BASELINE.md` y **no crear un nuevo F2-XX**. La prioridad es evolucionar la integración semántica mediante una frontera provider-neutral y seleccionar posteriormente un proveedor concreto solo cuando exista una decisión explícita y un entorno de validación controlado.

El scoring global continúa explícitamente bloqueado.

Ninguna decisión marcada como Pendiente deberá considerarse aprobada por defecto durante la implementación.
