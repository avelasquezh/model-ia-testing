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
| REQ-F1-040 … REQ-F1-046 | Cubierto | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | N/A | Pendiente |
| REQ-F1-047 … REQ-F1-054 | Cubierto | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | N/A | Cubierto | Pendiente |
| REQ-F1-055 … REQ-F1-065 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| REQ-F1-066 … REQ-F1-073 | Cubierto parcialmente | Pendiente | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | Cubierto | Pendiente |
| REQ-F1-074 … REQ-F1-115 | Pendiente / transversal | Pendiente | Parcial | Parcial | Parcial | Parcial | Parcial | Parcial | Pendiente |

### F1-05 — Resultados

`REQ-F1-040 … REQ-F1-046 → ScenarioResult → ProduceScenarioResult → ProduceScenarioResult.test.ts → CI`

El resultado conserva `executionId`, `scenarioId`, `scenarioVersion` y `evidenceId`. También distingue el resultado de ejecución de la evaluación de calidad, que permanece como `NOT_EVALUATED` en esta baseline.

### F1-06 — Hallazgos

`REQ-F1-047 … REQ-F1-054 → TestFinding → RegisterTestFinding → RegisterTestFinding.test.ts → CI`

Cada hallazgo requiere una ejecución finalizada y evidencia perteneciente a esa ejecución. Los campos `impact`, `severity` y `risk` existen como datos del hallazgo, pero no se interpretan ni califican mediante una metodología dentro de este frente.

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
