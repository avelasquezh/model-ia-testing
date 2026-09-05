# Frente 1 — Matriz de trazabilidad

La trazabilidad se establece como una relación progresiva:

`REQ → AC → GHERKIN → TEST → IMPLEMENTACIÓN → CI → EVIDENCIA → RESULTADO → HALLAZGO → REPORTE`

Para decisiones arquitectónicas se añade una relación transversal:

`REQ / RESTRICCIÓN → ADR → COMPONENTE / PUERTO → TEST ARQUITECTÓNICO → CI`

En esta fase solo se congelan requisitos y relaciones iniciales. Las columnas de implementación, pruebas y CI permanecerán vacías hasta los frentes correspondientes.

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

## Cobertura inicial

| Requisito | Criterio aceptación | Gherkin | Test | Implementación | CI | Evidencia | Resultado | Hallazgo | Reporte |
|---|---|---|---|---|---|---|---|---|---|
| REQ-F1-001 … REQ-F1-115 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

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

Los ADR permanecen como propuestas hasta que la revisión arquitectónica y los spikes definidos proporcionen evidencia suficiente para aprobarlos. No se deben inventar relaciones REQ→ADR que todavía no hayan sido analizadas.

La matriz se completará incrementalmente. No se deberán inventar vínculos antes de que exista el artefacto correspondiente.
