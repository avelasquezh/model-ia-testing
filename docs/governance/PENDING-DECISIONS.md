# Registro de decisiones pendientes

Este registro distingue decisiones metodológicas aún no aprobadas de decisiones arquitectónicas documentadas como baseline o pendientes de validación.

## Gobierno de la secuencia F2

La baseline oficial del MVP de Frente 2 comprende exactamente **F2-01 a F2-35**. El documento normativo es `docs/evaluation/F2-INCREMENT-BASELINE.md`.

Los identificadores **F2-36 a F2-46 no forman parte de la secuencia oficial del MVP**. Se conservan como nombres históricos de artefactos ya materializados para no perder trazabilidad, pero desde esta fecha se clasifican según las extensiones y validaciones ya reconciliadas.

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

Esta clasificación **no renumera ni modifica retrospectivamente F2-01 a F2-35**.

## Frente Adaptive — decisión operativa vigente

El frente prioritario del MVP es validar una capacidad generalizable de interacción con chatbots sobre URLs públicas arbitrarias. Su objetivo es:

`URL pública → descubrir chat → abrir chat → localizar composer → enviar "Hello" → confirmar envío → observar nueva respuesta → confirmar recepción → VERIFIED`

`Adaptive` es el modelo de evolución y `Legacy` permanece como baseline determinista de comparación.

Las siguientes decisiones se consideran vigentes para la implementación, aunque puedan requerir futura formalización metodológica:

- No considerar `CHAT_SURFACE_FOUND` ni `CANDIDATE_FOUND` como éxito funcional.
- No declarar un chatbot por el simple hallazgo de un launcher, formulario, buscador, registro o superficie de soporte.
- Priorizar evidencia posterior a la acción sobre evidencia estática previa.
- Exigir evidencia de mensaje enviado y de una **respuesta nueva posterior al envío** para alcanzar `VERIFIED`.
- Mantener Adaptive independiente de locators específicos de sitios concretos.
- Tratar Page, Frame y widgets anidados como contextos explorables, sin perder la identidad del contexto activo.
- Conservar la ruta de descubrimiento y las señales utilizadas para permitir auditoría y depuración.
- No aumentar timeouts como sustituto de una hipótesis causal.
- No desplazar el frente hacia scoring global, nuevos proveedores de IA u Ollama mientras no sean necesarios para P0/P1.

## Estado de validación Adaptive

El CI y la batería de tests están operativos, pero la última ejecución pública confirmada mantuvo `verifiedCount = 0`. Por tanto, **la conversación pública verificable continúa pendiente**.

Esta ausencia de verificación debe seguir visible en reportes y documentación. Un aumento de discovery rate sin interacción verificada no constituye por sí mismo una mejora funcional suficiente.

## Metodología de evaluación

- Validar dimensiones y criterios definitivos del Frente 2 mediante casos reales/controlados.
- Definir tratamiento estadístico de repetición y variabilidad cuando exista evidencia suficiente.
- Definir límites de confianza/incertidumbre si las métricas lo requieren.
- La validación de un proveedor/modelo de IA real continúa pendiente y no bloquea por sí sola el frente de interacción Adaptive.
- D4 y D5 requieren protocolos empíricos específicos antes de considerarse validados.

## Calificación

- Validar escala global 0–100 o mantener perfil de calidad observable.
- Validar pesos por dimensión.
- Validar tratamiento de criterios críticos.
- Validar efecto de INCONCLUSIVE y NOT_EVALUABLE.
- Validar sensibilidad a fallos críticos.
- Validar reproducibilidad y estabilidad del modelo de agregación.

Estas decisiones no deben bloquear P0/P1 del flujo conversacional Adaptive.

## Arquitectura — estado actual

Las decisiones arquitectónicas documentadas como ADR pueden pasar a estado validado únicamente cuando existe evidencia suficiente. F3 está validado mediante sus spikes ejecutables.

- ADR-003 — Stack tecnológico: **baseline materializada; validación integral pendiente**.
- ADR-004 — Persistencia PostgreSQL: **baseline materializada; migraciones y repositorio de Execution implementados; validación operacional integral pendiente**.
- ADR-005 — Modelo de ejecución: **baseline materializada**.
- ADR-006 — Estrategia BDD/TDD: **materializada en pruebas existentes; validación integral pendiente**.
- ADR-007 — Almacenamiento de evidencia: **materializado parcialmente**.
- ADR-008 — Aislamiento Playwright: **materializado parcialmente**.
- ADR-009 — Evaluador IA: **contrato y trazabilidad base validados; ningún proveedor concreto adoptado**.
- ADR-010 — CI/CD y Quality Gates: **materializado en workflows**.
- ADR-011 — API y contratos: **pendiente de validación de la interfaz externa**.
- ADR-012 — Autenticación y autorización: **política definida; implementación pública pendiente**.
- ADR-013 — Observabilidad: **baseline parcial**.
- ADR-014 — Configuración y secretos: **baseline definida; validación completa pendiente**.
- ADR-015 — Versionado: **baseline aprobada; contexto integrado en Execution y persistido; validación histórica integral pendiente**.
- ADR-016 — Estructura modular: **baseline materializada parcialmente; validación estática integral pendiente**.
- ADR-017 — SDLC seguro y flujo Git: **política definida; controles operativos completos pendientes**.

## Automatización

- Seleccionar POM, Screenplay u otra abstracción de UI únicamente si el spike demuestra beneficio real.
- Definir detalles de fixtures y test doubles.
- Definir estrategia de datos de prueba.

La abstracción de UI no debe imponerse por estética: debe mejorar la capacidad del flujo Adaptive para descubrir e interactuar con superficies desconocidas.

## CI/CD

- Definir artefactos concretos de evidencia y retención.
- Definir política operativa de ramas/PR y protección de `main`.
- Seleccionar herramientas concretas para SAST, secret scanning y análisis de dependencias.

## Próximo punto de decisión

El próximo incremento debe continuar P0/P1 del frente Adaptive: obtener al menos una ruta pública con `VERIFIED`, explicar las causas de las rutas no verificadas y fortalecer la generalización del descubrimiento/interacción.

No crear un nuevo `F2-XX` para este trabajo. Registrar extensiones o validaciones con la nomenclatura canónica existente o como incrementos explícitos del MVP Adaptive.

El scoring global continúa explícitamente bloqueado.

Ninguna decisión marcada como Pendiente deberá considerarse aprobada por defecto durante la implementación.
