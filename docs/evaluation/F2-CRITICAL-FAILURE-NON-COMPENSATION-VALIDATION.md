# F2 — Validación metodológica de no compensación ante fallos críticos

## 1. Propósito

Validar que una agregación de cumplimiento alto no pueda ocultar un fallo crítico de un criterio explícitamente marcado como crítico.

Este incremento es un spike metodológico. No implementa todavía un motor de scoring productivo ni define una política universal de criticidad.

## 2. Hipótesis

Una agregación puramente compensatoria puede producir un cumplimiento elevado aunque exista un fallo crítico. Por ejemplo, cuatro criterios con un fallo crítico y tres aprobados producen un cumplimiento candidato de 0.75, pero ese valor no debe permitir presentar la dimensión como aprobada.

La hipótesis metodológica es que la criticidad debe poder actuar como una regla de no compensación independiente del promedio numérico.

## 3. Propiedades validadas

### CRIT-V01 — Fallo crítico domina la agregación de estado

Si existe al menos un criterio crítico con estado `FAIL`, el estado candidato de la dimensión debe ser `FAIL`, aunque el cumplimiento numérico compensatorio sea alto.

### CRIT-V02 — El promedio no sustituye al estado

El indicador candidato de cumplimiento y el estado de la dimensión son magnitudes diferentes. Un 75 % de cumplimiento no implica `PASS` cuando existe un fallo crítico.

### CRIT-V03 — Fallo no crítico también permanece explícito

Un `FAIL` no crítico tampoco debe convertirse silenciosamente en `PASS`. La regla de criticidad agrega una condición de no compensación; no elimina los fallos ordinarios.

### CRIT-V04 — Ausencia de fallo crítico

Si el criterio crítico pasa y existe un resultado `PARTIAL`, el estado candidato permanece sujeto a las reglas normales de agregación. El override crítico no se activa.

### CRIT-V05 — Criticidad trazable

La propiedad `critical` debe permanecer asociada al criterio evaluado para que la decisión de no compensación sea auditable.

## 4. Resultado

La validación confirma que un promedio alto puede ocultar un fallo crítico y que, por tanto, una política posterior de agregación necesita una regla explícita de no compensación.

El spike demuestra la propiedad metodológica, pero no establece todavía qué criterios deben ser críticos, quién los declara críticos ni si la regla debe aplicarse a todas las dimensiones de forma idéntica.

## 5. Decisiones pendientes

Continúan abiertas:

- catálogo definitivo de criterios críticos;
- autoridad para declarar criticidad;
- versión y trazabilidad de la política de criticidad;
- tratamiento de múltiples fallos críticos;
- interacción con `INCONCLUSIVE` y `NOT_EVALUABLE`;
- interacción con riesgo;
- interacción con score global;
- reglas específicas por dimensión;
- posibilidad de overrides adicionales.

## 6. Criterio de salida

La no compensación ante un fallo crítico queda validada como propiedad metodológica necesaria para el diseño posterior de agregación/scoring.

No se crea todavía una entidad `CriticalCriterion`, un motor de scoring ni una regla productiva global.
