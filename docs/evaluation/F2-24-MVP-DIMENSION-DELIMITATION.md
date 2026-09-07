# F2-24 — Delimitación de dimensiones del MVP

**Estado:** **CERRADO / VALIDADO**

## 1. Propósito

Convertir las siete dimensiones candidatas de F2 en un perímetro explícito para el MVP. La delimitación se realiza por observabilidad, reproducibilidad, dependencia de canal y complejidad metodológica.

El objetivo del MVP no es producir una medida universal de calidad del chatbot. El objetivo es demostrar una cadena reproducible y auditable:

`Escenario → Criterio aplicable → Interacción → Evidencia → Regla → Resultado`

## 2. Decisión del perímetro MVP

### Núcleo obligatorio

Estas dimensiones forman el núcleo inicial porque pueden evaluarse mediante interacción externa y no dependen necesariamente de una interfaz web específica:

- **D1 — Corrección funcional observable**
- **D2 — Adecuación conversacional**
- **D3 — Continuidad contextual**
- **D4 — Robustez conversacional**
- **D6 — Rendimiento conversacional observable**

### Extensiones condicionadas

- **D5 — Seguridad y comportamiento responsable observable:** queda fuera del núcleo obligatorio y se activa únicamente cuando exista un escenario, política o requisito explícito que defina el comportamiento esperado y su evidencia.
- **D7 — Calidad de interacción e interfaz:** queda fuera del núcleo conversacional y se incorpora como extensión dependiente del canal, por ejemplo web/Playwright.

La exclusión del núcleo no significa que D5 o D7 carezcan de valor; evita convertir la primera versión en una plataforma de seguridad integral o auditoría UX/UI.

## 3. Criterios incluidos inicialmente

| Dimensión | Criterios MVP iniciales |
|---|---|
| D1 | D1-C01, D1-C02, D1-C03, D1-C04 |
| D2 | D2-C01, D2-C02, D2-C04, D2-C05 |
| D3 | D3-C01, D3-C02, D3-C03, D3-C04 |
| D4 | D4-C01, D4-C03, D4-C04 |
| D6 | D6-C01, D6-C03, D6-C04 |

## 4. Criterios pospuestos

Los siguientes criterios permanecen fuera de la primera implementación porque requieren formalización adicional de repetición, variabilidad, estadística o infraestructura especializada:

- D1-C05 — consistencia de resultado;
- D3-C05 — persistencia dentro del alcance;
- D4-C05 — estabilidad conversacional;
- D6-C02 — variabilidad temporal;
- D6-C05 — rendimiento bajo carga.

Su ausencia del núcleo MVP no implica que sean irrelevantes. Se incorporarán después de formalizar el tratamiento de repetición y variabilidad.

D4-C02 — corrección ortográfica/lingüística también queda condicionado a que un escenario defina expresamente la tolerancia esperada. No se convierte en comportamiento obligatorio del MVP.

## 5. Regla de canal

Los criterios del núcleo no deben asumir HTML, DOM o Playwright. La evidencia requerida debe poder provenir de un adaptador de canal.

Por tanto:

`D1-D6 núcleo conversacional → contrato observable independiente del canal`

`D7 → extensión de interfaz/canal`

Playwright permanece como adaptador, no como requisito conceptual del dominio.

## 6. Regla de aplicabilidad

La existencia de un criterio en el catálogo no implica que deba ejecutarse en toda ejecución. Cada ejecución debe seleccionar explícitamente los criterios aplicables según su contexto.

Un criterio no aplicable no se convierte en `FAIL`, no se contabiliza como incumplimiento y debe conservar una razón de no aplicabilidad.

## 7. Regla de evaluabilidad

Un criterio entra al MVP solo si puede demostrar:

1. objetivo verificable;
2. precondiciones explícitas;
3. entrada reproducible;
4. comportamiento esperado o comparación definida;
5. evidencia observable suficiente;
6. regla de decisión explícita;
7. limitaciones declaradas.

Esta regla mantiene consistente la delimitación con el contrato metodológico ya implementado.

## 8. Casos controlados de aceptación de la delimitación

### Caso A — Chatbot conversacional funcional

Contexto: interacción externa con entrada y respuesta.

Debe poder activar como mínimo D1-C01, D2-C01 y D6-C01 sin depender de UI específica.

### Caso B — Conversación multi-turno

Contexto: dos o más turnos donde una referencia depende de información previa.

Debe poder activar D3-C01 y D3-C02.

### Caso C — Reformulación o entrada no prevista

Contexto: variante semántica o entrada fuera del flujo principal.

Debe poder activar D4-C01 o D4-C03 y conservar evidencia de la decisión.

### Caso D — Condición de rendimiento simple

Contexto: medición del tiempo observable de respuesta en una ejecución individual.

Debe poder activar D6-C01. No autoriza inferencias sobre rendimiento interno ni sobre carga.

### Caso E — Canal web

Contexto: ejecución con navegador y evidencia DOM/screenshot.

Puede añadir D7-C01..C05 sin convertir D7 en requisito del núcleo conversacional.

### Caso F — Seguridad explícitamente definida

Contexto: escenario con política observable y comportamiento esperado.

Puede activar D5-C01..C04 cuando exista el contrato de seguridad correspondiente. D5-C05 permanece fuera de evaluabilidad por definición de observabilidad.

## 9. Invariantes de la delimitación

1. El núcleo MVP no depende de un canal específico.
2. La selección de criterios es explícita por ejecución.
3. `NOT_APPLICABLE` no equivale a `FAIL`.
4. Los criterios pospuestos no deben forzarse mediante resultados o scoring artificiales.
5. D7 no introduce dependencia Playwright en el dominio.
6. D5 no se presenta como auditoría de seguridad interna.
7. Ninguna dimensión recibe peso o puntuación global en este incremento.

## 10. Fuera de alcance

Este incremento no define:

- scoring global;
- pesos;
- fórmula de calidad;
- modelo estadístico de repetición;
- intervalos de confianza;
- proveedor de IA evaluadora;
- taxonomía definitiva de seguridad;
- auditoría de UX/accesibilidad completa;
- pruebas de carga.

## 11. Criterio de salida

La delimitación se considera estable para continuar el desarrollo cuando:

- exista un catálogo de dimensiones y criterios con perímetro explícito;
- los casos controlados anteriores puedan representarse como escenarios del producto;
- el motor de selección pueda diferenciar aplicable/no aplicable;
- las futuras evaluaciones respeten la separación entre ejecución, evidencia, criterio y scoring.

### Evidencia de implementación y validación

F2-24 quedó materializado mediante el alcance ejecutable `MVP_CORE`, el filtrado explícito de los 18 criterios del núcleo, la conservación de aplicabilidad por contexto y la persistencia del alcance en `EvaluationPlan`.

La implementación fue validada con:

- CI `34093226220`, commit `1e21df7360361f9bd3956e93c6f1d4e649c6766e`: **success** en TypeScript, migraciones PostgreSQL, pruebas unitarias/aplicación, BDD, Playwright E2E y quality gate.
- Architecture Spike `34093226273`, mismo commit: **success** en SPIKE-001 a SPIKE-012, incluyendo integración PostgreSQL/versioning y quality gate.

La corrección `1e21df7` solo alineó una prueba existente con el nuevo campo obligatorio `scope` de `EvaluationPlan`; no modificó la decisión metodológica.

## 12. Siguiente incremento

**F2-25 — Selección contextual de criterios.** Convertir el alcance del MVP en una selección determinista por contexto y escenario, conservando trazabilidad de por qué cada criterio fue incluido, excluido o marcado `NOT_APPLICABLE` en una ejecución concreta.

Después se formalizará la repetición y variabilidad antes de diseñar scoring global.
