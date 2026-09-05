# Frente 1 — Matriz de trazabilidad

La trazabilidad se establece como una relación progresiva:

`REQ → AC → GHERKIN → TEST → IMPLEMENTACIÓN → CI → EVIDENCIA → RESULTADO → HALLAZGO → REPORTE`

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

## Cobertura inicial

| Requisito | Criterio aceptación | Gherkin | Test | Implementación | CI | Evidencia | Resultado | Hallazgo | Reporte |
|---|---|---|---|---|---|---|---|---|---|
| REQ-F1-001 … REQ-F1-115 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

La matriz se completará incrementalmente. No se deberán inventar vínculos antes de que exista el artefacto correspondiente.
