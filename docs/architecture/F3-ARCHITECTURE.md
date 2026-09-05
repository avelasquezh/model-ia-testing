# Frente 3 — Arquitectura y diseño de alto nivel

**Versión:** 0.2  
**Estado:** Baseline arquitectónica consolidada; implementación condicionada a validación por spike

## 1. Propósito

Definir una arquitectura para `model-ia-testing` que permita implementar el MVP sin acoplar el dominio a Playwright, PostgreSQL, un proveedor de IA, HTTP, UI o infraestructura concreta.

La arquitectura debe preservar:

- testabilidad;
- mantenibilidad;
- trazabilidad;
- aislamiento de infraestructura;
- evidencia reproducible;
- extensibilidad;
- seguridad operacional;
- validación automática mediante CI/CD.

## 2. Decisión arquitectónica

Se adopta como baseline un **monolito modular con arquitectura hexagonal (Ports and Adapters)** y separación explícita entre dominio, aplicación, adaptadores e infraestructura.

El MVP no se diseñará como un conjunto de microservicios. La extracción de componentes solo se considerará cuando exista evidencia de una necesidad operativa, de escalabilidad, aislamiento o despliegue independiente.

## 3. Principios arquitectónicos

### 3.1 Independencia del dominio

Las reglas de negocio y evaluación no deberán depender de Playwright, PostgreSQL, HTTP, Docker, GitHub Actions ni de un proveedor concreto de IA.

### 3.2 Inversión de dependencias

Las dependencias deben apuntar hacia abstracciones estables del dominio/aplicación. Los adaptadores de infraestructura implementan puertos definidos por las capas internas.

### 3.3 Evidencia como objeto de primera clase

La ejecución no deberá limitarse a producir un estado PASS/FAIL. Debe producir observaciones y referencias a evidencia que permitan reconstruir el resultado.

### 3.4 Separación de ejecución y evaluación

La automatización del navegador, la captura de evidencia, la verificación de criterios y la agregación de resultados son responsabilidades distintas.

### 3.5 No acoplamiento prematuro

No se introducirán microservicios, colas, caches, event buses u otros componentes distribuidos si el requisito no los justifica.

### 3.6 Seguridad por aislamiento

La ejecución sobre objetivos externos debe tratarse como una frontera de seguridad. El navegador y sus artefactos deberán poder ejecutarse con restricciones independientes del proceso principal.

### 3.7 Configuración externa

La configuración pertenece a infraestructura/composición de dependencias. El dominio no debe leer variables de entorno ni gestionar secretos.

### 3.8 Auditabilidad por diseño

Una decisión, resultado o artefacto relevante debe poder reconstruirse mediante identificadores, versiones y relaciones explícitas. La auditabilidad no se delega exclusivamente a logs.

## 4. Capas lógicas

### Dominio

Contiene conceptos y reglas independientes de infraestructura.

Responsabilidades esperadas:

- objetivos;
- escenarios;
- criterios;
- ejecuciones;
- observaciones;
- evidencia;
- resultados;
- hallazgos;
- evaluación;
- riesgo;
- reglas de agregación cuando estén aprobadas.

No contiene llamadas a Playwright, SQL, HTTP ni SDKs externos.

### Aplicación

Orquesta casos de uso mediante interfaces/puertos.

Ejemplos conceptuales:

- registrar objetivo;
- crear escenario;
- ejecutar escenario;
- capturar evidencia;
- evaluar criterio;
- registrar hallazgo;
- generar reporte.

Los casos de uso no deberán conocer detalles de implementación de los adaptadores.

### Adaptadores

Implementan las interfaces requeridas por aplicación/dominio.

Categorías iniciales:

- browser automation;
- persistencia;
- reloj/tiempo;
- almacenamiento de evidencia;
- proveedor de IA;
- generación de reportes;
- interfaces de entrada/salida.

### Infraestructura

Contiene configuración, composición de dependencias, procesos, contenedores, observabilidad y mecanismos de despliegue.

## 5. Módulos funcionales propuestos

Los módulos son límites lógicos iniciales. La estructura física definitiva deberá respetarlos y se validará mediante el spike de implementación.

1. **Target Management** — configuración y ciclo de vida del chatbot objetivo.
2. **Scenario Management** — escenarios, pasos, expectativas y versiones.
3. **Execution** — sesiones, ejecución de escenarios y estados operacionales.
4. **Evidence** — captura, metadatos, referencias e integridad de evidencia.
5. **Verification** — comparación entre observación y condición esperada.
6. **Evaluation** — evaluación de criterios y dimensiones.
7. **Findings** — hallazgos, severidad/riesgo y trazabilidad.
8. **Reporting** — construcción de reportes a partir de resultados persistidos.
9. **AI Evaluation** — integración opcional de modelos para interpretación asistida.

## 6. Reglas de dependencia

La dirección conceptual es:

`Entrada → Aplicación → Dominio`

Los adaptadores rodean al núcleo:

`Aplicación/Dominio ← Puertos ← Adaptadores ← Infraestructura externa`

Reglas obligatorias:

- Dominio → infraestructura: prohibido.
- Dominio → Playwright: prohibido.
- Dominio → PostgreSQL/ORM: prohibido.
- Dominio → proveedor IA: prohibido.
- Casos de uso → implementación concreta: prohibido.
- API → repositorio directo: prohibido.
- Un módulo funcional → persistencia interna de otro módulo: prohibido.
- Composición de dependencias → infraestructura/composition root.

Las dependencias excepcionales deberán documentarse mediante ADR o decisión técnica explícita.

## 7. Puertos principales

Los nombres son conceptuales y no constituyen todavía contratos de código.

- `BrowserAutomationPort`
- `EvidenceStoragePort`
- `TargetRepository`
- `ScenarioRepository`
- `ExecutionRepository`
- `ResultRepository`
- `FindingRepository`
- `ClockPort`
- `SemanticEvaluationPort`
- `ReportGeneratorPort`
- `NotificationPort` cuando exista un requisito que lo justifique.

No todos los puertos deberán existir en el primer incremento. Solo se crearán cuando un caso de uso necesite invertir una dependencia real.

## 8. Flujo lógico principal

`Scenario → Execution → Browser Port → Playwright Adapter → Target Bot → Observation → Evidence → Verification → Result → Finding/Evaluation → Report`

La cadena de evidencia deberá permanecer disponible para auditoría.

La evaluación no deberá modificar retrospectivamente la evidencia primaria capturada durante la ejecución.

## 9. API y contratos

La API HTTP se tratará como adaptador de entrada. Los contratos externos deberán estar separados de entidades de dominio y vinculados a casos de uso.

La validación de entrada ocurre en el borde. La API no accederá directamente a repositorios ni a Playwright.

Framework HTTP, esquema de errores y estrategia definitiva de versionado quedan sujetos a spike/ADR específico.

Referencia: ADR-011.

## 10. Persistencia

PostgreSQL se establece como propuesta para persistencia principal del MVP por la naturaleza relacional de la trazabilidad entre objetivos, escenarios, ejecuciones, pasos, evidencia, resultados y hallazgos.

La persistencia se accederá mediante puertos/repositorios. El dominio no deberá depender de SQL ni de ORM.

Las migraciones deberán ser versionadas y reproducibles.

Referencia: ADR-004.

## 11. Evidencia

La evidencia es una capacidad separada de la persistencia de entidades.

PostgreSQL conservará metadatos y relaciones de evidencia. El contenido binario se almacenará mediante un mecanismo físico abstraído por `EvidenceStoragePort`.

Cuando sea apropiado se conservará información de integridad, como hashes, junto con metadatos de captura.

Referencia: ADR-007.

## 12. Ejecución de navegador

Playwright se tratará como un adaptador de infraestructura detrás de `BrowserAutomationPort`.

La implementación deberá permitir sustituir o simular el navegador durante pruebas unitarias y de aplicación.

La ejecución real deberá realizarse en un entorno aislado, preferiblemente un contenedor dedicado para el MVP, con límites de tiempo, recursos, red y almacenamiento de artefactos.

Referencia: ADR-008.

## 13. Modelo de ejecución

El MVP utilizará inicialmente una ejecución controlada y síncrona a nivel de caso de uso, evitando una arquitectura distribuida prematura.

La ejecución tendrá como mínimo:

- identificador único;
- estado explícito;
- timeout global;
- timeouts operacionales;
- cancelación controlada cuando sea soportada;
- captura de evidencia;
- clasificación de errores técnicos;
- persistencia del estado final.

Una futura cola/worker distribuida será una evolución condicionada por evidencia de concurrencia, duración o aislamiento.

Referencia: ADR-005.

## 14. IA evaluadora

La IA será opcional y estará detrás de `SemanticEvaluationPort`.

Los criterios resolubles mediante reglas deterministas deberán utilizar esas reglas antes de recurrir a IA.

Toda evaluación asistida deberá registrar proveedor, modelo, versión/configuración, evidencia de entrada, método/instrucción versionada, salida y regla de aceptación correspondiente.

La IA no podrá convertir una propiedad no observable en una afirmación verificable.

Referencia: ADR-009.

## 15. Autenticación y autorización

La autenticación y autorización estarán fuera del dominio y se aplicarán en los adaptadores de entrada y en políticas de aplicación cuando corresponda.

Se aplicará mínimo privilegio. Los secretos no deberán almacenarse en código, logs ni evidencias.

La solución concreta de identidad deberá estar definida antes de exposición pública del producto.

Referencia: ADR-012.

## 16. Observabilidad

La observabilidad será transversal y separada de la evidencia funcional.

Se utilizarán, según necesidad:

- logs estructurados;
- métricas operacionales;
- identificadores de correlación;
- eventos técnicos;
- trazas cuando aporten valor diagnóstico.

No se registrarán secretos ni información sensible innecesaria.

Referencia: ADR-013.

## 17. Configuración y secretos

La configuración será externa al código y validada al iniciar la aplicación.

La aplicación recibirá configuración tipada desde la composición de dependencias. El dominio no accederá directamente a variables de entorno.

Los secretos serán suministrados mediante mecanismos seguros del entorno/CI y nunca versionados.

Referencia: ADR-014.

## 18. Versionado y reproducibilidad

Se distinguirán la versión del producto de las versiones metodológicas que afectan una evaluación.

Una ejecución deberá poder identificar al menos:

- revisión/versión del producto;
- versión de criterios;
- versión de reglas de decisión/agregación;
- versión del evaluador IA si participa;
- identificador de ejecución.

Referencia: ADR-015.

## 19. Estrategia de pruebas

Se adopta una estrategia por niveles:

1. Unitarias — dominio y reglas.
2. Aplicación — casos de uso y puertos con dobles de prueba.
3. Integración — adaptadores contra dependencias controladas.
4. BDD/Acceptance — Gherkin + Cucumber para comportamiento verificable.
5. E2E — Playwright para interacción real del navegador.

BDD constituye la especificación de comportamiento aceptable. TDD se utilizará donde proporcione feedback rápido y diseño testeable.

POM o Screenplay no se impondrán sin evidencia de que resuelven un problema concreto de mantenibilidad.

Referencia: ADR-006.

## 20. CI/CD y Quality Gates

GitHub Actions será el mecanismo CI/CD inicial.

Orden esperado de gates:

1. formato/lint;
2. compilación/type-check;
3. unitarias;
4. aplicación;
5. integración;
6. BDD/Cucumber;
7. E2E/Playwright cuando el entorno CI lo permita;
8. publicación de artefactos de prueba/evidencia;
9. quality gate final.

Los checks obligatorios que fallen bloquearán la promoción correspondiente.

Referencia: ADR-010.

## 21. SDLC y flujo Git

Los cambios relevantes deberán ser trazables a requisito, defecto, decisión o tarea.

Se priorizarán Pull Requests, revisión, CI obligatorio y protección de secretos conforme evolucione el trabajo colaborativo.

Los controles candidatos incluyen secret scanning, SAST, análisis de dependencias y revisión de permisos de GitHub Actions.

Referencia: ADR-017.

## 22. Patrones y principios aplicables

Se adoptan o evalúan explícitamente:

- **Hexagonal Architecture / Ports and Adapters:** aislamiento de infraestructura.
- **Dependency Inversion Principle:** núcleo dependiente de abstracciones.
- **Single Responsibility Principle:** separación de responsabilidades.
- **Open/Closed Principle:** extensibilidad mediante adaptadores/estrategias cuando sea viable.
- **Dependency Injection:** composición fuera de los casos de uso.
- **Strategy:** reglas de evaluación o comparación intercambiables.
- **Adapter:** Playwright, persistencia, IA, reporting y entrada HTTP.
- **Repository:** persistencia de agregados cuando el modelo lo justifique.
- **Factory:** construcción controlada de sesiones/variantes cuando exista una necesidad real.
- **DTO:** contratos externos separados del dominio.
- **State Machine:** estados controlados de ejecución.
- **Correlation Identifier:** trazabilidad operacional.
- **Secure SDLC / Least Privilege:** seguridad del ciclo de desarrollo y operación.

No se implementará un patrón únicamente para cumplir una lista. Cada uso deberá estar justificado y ser verificable.

## 23. Arquitectura de despliegue conceptual

`Cliente/API/UI`

`        ↓`

`Aplicación model-ia-testing`

`        ↓`

`Caso de uso de ejecución`

`        ↓`

`Browser Automation Adapter`

`        ↓`

`Entorno Playwright aislado`

`        ↓`

`Chatbot objetivo`

`        ↘`

`     PostgreSQL / Evidence Storage`

La topología física definitiva se definirá durante el diseño de despliegue y seguridad.

## 24. Riesgos arquitectónicos tratados

| Riesgo | Tratamiento |
|---|---|
| Acoplamiento del dominio a Playwright | Puerto + Adapter |
| Acoplamiento a PostgreSQL/ORM | Repository + puerto |
| Dependencia obligatoria de IA | SemanticEvaluationPort opcional |
| Evidencia insuficiente | Evidencia como objeto de primera clase |
| Resultados no auditables | IDs, versiones y cadena de trazabilidad |
| Objetivos externos no confiables | Aislamiento y límites operacionales |
| Arquitectura distribuida prematura | Monolito modular inicial |
| Fallos técnicos confundidos con fallos del bot | Separación Execution/Evaluation |
| Secretos expuestos | Configuración externa + controles CI |
| Cambios metodológicos que invalidan históricos | Versionado metodológico |
| Dependencias arquitectónicas accidentales | Reglas de módulos + controles estáticos candidatos |

## 25. ADRs del frente

| ADR | Tema | Estado |
|---|---|---|
| ADR-003 | Stack tecnológico | Propuesta |
| ADR-004 | Persistencia PostgreSQL | Propuesta |
| ADR-005 | Modelo de ejecución | Propuesta |
| ADR-006 | BDD/TDD y estrategia de pruebas | Propuesta |
| ADR-007 | Almacenamiento de evidencia | Propuesta |
| ADR-008 | Aislamiento Playwright | Propuesta |
| ADR-009 | Evaluador IA | Propuesta |
| ADR-010 | CI/CD y Quality Gates | Propuesta |
| ADR-011 | API y contratos | Propuesta |
| ADR-012 | Autenticación/autorización | Propuesta |
| ADR-013 | Observabilidad | Propuesta |
| ADR-014 | Configuración y secretos | Propuesta |
| ADR-015 | Versionado | Propuesta |
| ADR-016 | Estructura modular | Propuesta |
| ADR-017 | SDLC seguro y flujo Git | Propuesta |

## 26. Spike obligatorio antes de implementación

Antes de generar la estructura productiva definitiva se realizará un spike técnico que valide como mínimo:

1. TypeScript estricto y compilación.
2. Separación real dominio/aplicación/adaptadores.
3. Caso de uso probado sin infraestructura.
4. Gherkin + Cucumber ejecutándose en CI.
5. Playwright ejecutando una interacción controlada.
6. Sustitución/mock del puerto de navegador en pruebas no E2E.
7. Persistencia PostgreSQL mediante migración reproducible.
8. Captura y referencia de una evidencia de prueba.
9. Quality gates de GitHub Actions.
10. Controles que impidan dependencias arquitectónicas prohibidas cuando el tooling elegido lo permita.

El spike debe producir evidencia y una conclusión explícita: **VALIDADO**, **VALIDADO CON CAMBIOS** o **NO VALIDADO**.

## 27. Criterio de cierre de Frente 3

El frente podrá cerrarse cuando:

1. los límites de módulos estén definidos;
2. las dependencias entre módulos sean explícitas;
3. los puertos principales estén identificados;
4. las decisiones tecnológicas críticas tengan ADR;
5. los riesgos arquitectónicos relevantes tengan tratamiento;
6. la estrategia de pruebas por niveles esté definida;
7. la estrategia CI/CD tenga Quality Gates trazables;
8. configuración, secretos, seguridad, observabilidad y versionado estén cubiertos;
9. exista una matriz de trazabilidad arquitectónica;
10. los ADR que dependan de validación empírica hayan sido probados mediante spike;
11. no queden contradicciones conocidas entre los ADR y la arquitectura consolidada.

**Estado actual:** arquitectura documental consolidada. El cierre definitivo requiere revisión de coherencia y validación del spike técnico antes de iniciar implementación productiva.
