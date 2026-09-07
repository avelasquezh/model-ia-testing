# F2 — Validación metodológica del modelo de riesgo

## 1. Propósito

Validar las propiedades mínimas de la fórmula candidata de riesgo antes de convertirla en una política productiva.

Este incremento es un **spike metodológico**. No introduce un motor de riesgo, umbrales P0–P3 ni persistencia de prioridades.

## 2. Hipótesis evaluada

La propuesta actual es:

`Risk Score = Impacto × Probabilidad × Exposición`

`Incertidumbre` permanece como factor separado de priorización mientras el modelo siga en estado `DRAFT`.

## 3. Casos de validación

| Caso | Propiedad | Resultado esperado |
|---|---|---|
| RISK-V01 | Reproducibilidad | mismos factores → mismo score |
| RISK-V02 | Sensibilidad a impacto | aumentar impacto aumenta score |
| RISK-V03 | Sensibilidad a probabilidad | aumentar probabilidad aumenta score |
| RISK-V04 | Sensibilidad a exposición | aumentar exposición aumenta score |
| RISK-V05 | Separación de incertidumbre | cambiar incertidumbre no altera el score candidato |
| RISK-V06 | Escala de factores | cada factor permanece entre 1 y 5 |
| RISK-V07 | Rango candidato | score entre 1 y 125 |

## 4. Resultado de la validación

Los casos se ejecutan como prueba aislada en `spike/evaluation/risk-model-validation.test.ts`.

La validación demuestra propiedades matemáticas básicas de la propuesta, pero **no demuestra todavía utilidad operativa suficiente para congelar la fórmula**.

En particular, quedan pendientes:

- comparación con casos reales de priorización;
- sensibilidad práctica ante cambios de factores;
- validación de la utilidad de la incertidumbre como factor separado;
- definición de umbrales P0–P3;
- revisión de posibles sesgos entre dimensiones;
- criterio formal para modificar una prioridad;
- validación de la auditabilidad de una prioridad calculada.

## 5. Decisión metodológica

Con esta validación no se aprueba todavía la fórmula como política productiva.

Sí queda habilitada como **candidata técnica para pruebas posteriores** porque cumple las propiedades básicas de reproducibilidad, monotonicidad y rango esperado.

No se implementa aún ningún `RiskScore` de dominio ni servicio productivo. Tampoco se mezclan riesgo, resultado de calidad, severidad o scoring.

## 6. Trazabilidad

`Objetivo → Riesgo → Escenario → Criterio → Evidencia → Medición → Resultado`

El riesgo continúa siendo un mecanismo de priorización y no un sustituto de la evidencia ni del resultado de calidad.

## 7. Estado

**F2 — Validación inicial completada; modelo de riesgo todavía DRAFT.**

El siguiente incremento lógico podrá abordar la integración explícita de riesgo con la priorización de escenarios, únicamente si la validación metodológica adicional justifica congelar las reglas necesarias. El scoring global continúa fuera de implementación productiva.
