# Frente 1 — Matriz de trazabilidad

La trazabilidad se establece como una relación progresiva:

`REQ → AC → GHERKIN → TEST → IMPLEMENTACIÓN → CI → EVIDENCIA → RESULTADO → HALLAZGO → REPORTE`

Para decisiones arquitectónicas se añade una relación transversal:

`REQ / RESTRICCIÓN → ADR → COMPONENTE / PUERTO → TEST ARQUITECTÓNICO → CI`

La matriz se completa incrementalmente. No se inventan vínculos antes de que exista el artefacto correspondiente.

## Reglas

1. Todo requisito funcional deberá tener un identificador estable.
2. Todo requisito funcional deberá tener criterios de aceptación antes de su implementación.
3. Los comportamientos relevantes deberán representarse mediante Gherkin cuando corresponda.
4. Todo escenario automatizado deberá poder rastrearse hasta su requisito.
5. Toda ejecución deberá conservar referencia al escenario y versión utilizados.
6. Todo resultado deberá poder rastrearse hasta su evidencia.
7. Todo hallazgo deberá poder rastrearse hasta la evidencia que lo sustenta.
8. La ausencia de cobertura deberá ser visible.
9. Los cambios de requisitos deberán conservar historial.
10. Toda decisión arquitectónica relevante deberá tener un ADR o quedar explícitamente justificada como no aplicable.
11. Un patrón o tecnología no se considerará adoptado únicamente por aparecer en documentación; deberá existir una necesidad y un criterio de validación.
12. Las reglas arquitectónicas críticas deberán convertirse en controles automatizables cuando sea técnicamente viable.

## Cobertura implementada

| Requisito | Criterio aceptación | Gherkin | Test | Implementación | CI | Evidencia | Resultado | Hallazgo | Reporte |
|---|---|---|---|---|---|---|---|---|---|
| REQ-F1-001 … REQ-F1-004 | Cubierto | Pendiente | Cubierto | Cubierto | Cubierto | N/A | N/A | N/A | N/A |
| REQ-F1-005 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | N/A | Pendiente | N/A | N/A |
| REQ-F1-006 … REQ-F1-015 | Cubierto parcialmente por escenarios/suites | Pendiente | Cubierto | Cubierto | Cubierto | N/A | N/A | N/A | N/A |
| REQ-F1-016 … REQ-F1-027 | Cubierto parcialmente | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto parcialmente | Pendiente | N/A | N/A |
| REQ-F1-028 … REQ-F1-039 | Cubierto parcialmente | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | Pendiente | N/A | N/A |
| REQ-F1-040 … REQ-F1-046 | Cubierto | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | N/A | Cubierto |
| REQ-F1-047 … REQ-F1-054 | Cubierto | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | N/A | Cubierto | Cubierto |
| REQ-F1-055 … REQ-F1-065 | Cubierto | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto |
| REQ-F1-066 … REQ-F1-073 | Cubierto | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto parcialmente |
| REQ-F1-074 … REQ-F1-082 | Cubierto parcialmente | Pendiente | Cubierto | Cubierto | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| REQ-F1-083 … REQ-F1-092 | Cubierto parcialmente | Cubierto | Cubierto parcialmente | Cubierto parcialmente | Cubierto | Cubierto parcialmente | Pendiente | Pendiente | Pendiente |
| REQ-F1-093 … REQ-F1-099 | Cubierto parcialmente | Pendiente | Cubierto | Cubierto parcialmente | Pendiente | Cubierto parcialmente | Pendiente | Pendiente | Pendiente |
| REQ-F1-100 … REQ-F1-115 | Pendiente / transversal | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

### F1-05 — Resultados

`REQ-F1-040 … REQ-F1-046 → ScenarioResult → ProduceScenarioResult → ProduceScenarioResult.test.ts → CI`

El resultado conserva `executionId`, `scenarioId`, `scenarioVersion` y `evidenceId`. También distingue el resultado de ejecución de la evaluación de calidad, que permanece como `NOT_EVALUATED` en esta baseline.

### F1-06 — Hallazgos

`REQ-F1-047 … REQ-F1-054 → TestFinding → RegisterTestFinding → RegisterTestFinding.test.ts → CI`

Cada hallazgo requiere una ejecución finalizada y evidencia perteneciente a esa ejecución. Los campos `impact`, `severity` y `risk` existen como datos del hallazgo, pero no se interpretan ni califican mediante una metodología dentro de este frente.

### F1-07 — Reportes

`REQ-F1-055 … REQ-F1-065 → TestReport → GenerateTestReport → GenerateTestReport.test.ts → CI`

El reporte puede agrupar una o varias ejecuciones y conserva sus relaciones con objetivo, escenario/versionado, evidencia, resultado y hallazgos. Las limitaciones de observabilidad y los estados no evaluables se exponen explícitamente; la interpretación de calidad permanece separada y no se agrega scoring en este frente.

### F1-08 — Trazabilidad

`REQ-F1-066 … REQ-F1-073 → RequirementTrace → RegisterRequirementTrace → RegisterRequirementTrace.test.ts → CI`

La trazabilidad se materializa como un artefacto por requisito. Cada registro conserva los identificadores de escenarios, ejecuciones, resultados, hallazgos y reportes relacionados y expone explícitamente `COVERED` o `UNCOVERED`. El dominio rechaza identificadores vacíos, duplicados y estados de cobertura inconsistentes.

El artefacto no intenta derivar vínculos que el sistema todavía no puede observar; registra únicamente relaciones suministradas de forma explícita por la aplicación. La ausencia de escenarios hace visible un requisito sin cobertura.

### F1-09 — Calidad técnica

`REQ-F1-074 … REQ-F1-082 → ResponsibilityCheck → RecordResponsibilityCheck → RecordResponsibilityCheck.test.ts → CI`

La primera materialización de F1-09 registra controles de responsabilidad y separación arquitectónica sin introducir scoring. `ResponsibilityCheck` conserva el componente evaluado, sus dependencias externas y las violaciones observadas; `passed` únicamente indica si existen violaciones registradas. La interpretación de severidad, riesgo o calidad global queda fuera de este incremento.

### F1-10 — BDD y automatización

`REQ-F1-083 … REQ-F1-087 → architecture.feature → architecture.steps.ts → ExecuteScenario → CI`

El escenario Gherkin utiliza el caso de uso actual y dobles controlados para validar comportamiento sin depender del navegador. Los tags hacen explícita la relación con los requisitos.

La automatización de navegador permanece separada de BDD: el spike Playwright valida la apertura y navegación mediante `PlaywrightBrowserAdapter`, mientras que las pruebas del adapter conversacional cubren la interacción de UI. La abstracción de UI se concentra en `PlaywrightConversationUi` y se configura mediante definiciones de locators, sin introducir POM o Screenplay como formalismo obligatorio.

`REQ-F1-088 … REQ-F1-090` quedan parcialmente cubiertos por `ADR-006-TEST-STRATEGY-BDD-TDD.md`, que propone la estrategia por niveles y el uso diferenciado de BDD/TDD. El ADR permanece en estado propuesta.

`REQ-F1-091 … REQ-F1-092` tienen implementación técnica en Playwright y una abstracción de UI configurable; la decisión definitiva sobre la abstracción queda condicionada al criterio arquitectónico documentado.

### F1-11 — Seguridad y límites

`REQ-F1-093 … REQ-F1-099 → ExecutionSecurityPort / SecureExecuteScenario / InMemoryExecutionSecurityPolicy → pruebas de política y ejecución segura → CI`

`REQ-F1-096` queda materializado mediante una política de autorización explícita por `targetId` antes de ejecutar el escenario. Este control de alcance no pretende reemplazar autenticación de actores.

`REQ-F1-097` conserva timeout positivo y límite máximo de ejecución. `REQ-F1-098` se apoya en el modelo de errores técnicos de ejecución y su conservación operacional. `REQ-F1-099` combina validación de URLs HTTP/HTTPS con autorización previa del objetivo.

`REQ-F1-094 … REQ-F1-095` quedan cubiertos parcialmente por la separación de configuración y secretos documentada en ADR-014; la materialización final depende del composition root y del entorno de despliegue.

`REQ-F1-093` permanece condicionado al diseño de aislamiento de despliegue definido en ADR-008. No se introduce aislamiento ficticio dentro del dominio.

## Trazabilidad arquitectónica

| Artefacto | Decisión / responsabilidad | Estado |
|---|---|---|
| ADR-003 | Stack tecnológico | Propuesta |
| ADR-004 | Persistencia PostgreSQL | Propuesta |
| ADR-005 | Modelo de ejecución | Propuesta |
| ADR-006 | Estrategia BDD/TDD | Propuesta |
| ADR-007 | Almacenamiento de evidencia | Propuesta |
| ADR-008 | Aislamiento Playwright | Propuesta |
| ADR-009 | Evaluador IA | Propuesta |
| ADR-010 | CI/CD y quality gates | Propuesta |
| ADR-011 | API y contratos | Propuesta |
| ADR-012 | Autenticación/autorización | Propuesta |
| ADR-013 | Observabilidad | Propuesta |
| ADR-014 | Configuración y secretos | Propuesta |
| ADR-015 | Versionado | Propuesta |
| ADR-016 | Estructura modular | Propuesta |
| ADR-017 | SDLC seguro y flujo Git | Propuesta |

Los ADR permanecen como propuestas hasta que la revisión arquitectónica y los spikes definidos proporcionen evidencia suficiente para aprobarlos. No se inventan relaciones REQ→ADR todavía no analizadas.
