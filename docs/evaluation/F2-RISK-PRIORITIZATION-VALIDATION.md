# F2 — Validación metodológica de priorización de riesgo

## 1. Propósito

Validar propiedades operativas mínimas del ordenamiento de escenarios antes de convertir el modelo candidato de riesgo en una política de producción.

Este entregable es un spike metodológico. No crea un motor de riesgo, no define umbrales P0–P3 y no congela la fórmula definitiva.

## 2. Punto de partida

La propuesta vigente mantiene:

`Risk Score candidato = Impacto × Probabilidad × Exposición`

La incertidumbre permanece separada del multiplicador y puede utilizarse como señal de priorización secundaria. La fórmula y los niveles de prioridad continúan en estado `DRAFT`.

## 3. Propiedades validadas

### RPV-01 — Orden por riesgo candidato

Cuando dos escenarios tienen distinto `Risk Score` candidato, el de mayor score debe aparecer antes en el orden de priorización experimental.

### RPV-02 — Incertidumbre como desempate experimental

Cuando dos escenarios tienen el mismo score candidato, un escenario con mayor incertidumbre puede colocarse primero como mecanismo experimental de exploración.

Esto no constituye todavía una regla de producción.

### RPV-03 — Detección de empates estructurales

La multiplicación puede producir el mismo score con perfiles de factores diferentes. Por tanto, el score aislado no describe completamente el perfil de riesgo y no debe utilizarse como única explicación de prioridad.

### RPV-04 — Separación de incertidumbre y score

Modificar únicamente la incertidumbre no modifica el score candidato. Esto mantiene separadas las dos magnitudes y permite estudiar su efecto sobre la planificación sin alterar artificialmente el riesgo calculado.

### RPV-05 — Auditabilidad mínima

Una representación de priorización debe conservar, como mínimo, el identificador del caso y los cuatro factores utilizados para la decisión experimental. En producción también deberán conservarse fuente de cada valor, versión de fórmula, fecha de cálculo, mecanismo/persona y prioridad resultante, conforme al modelo general de riesgo.

## 4. Resultado

Las propiedades matemáticas y de ordenamiento básico son reproducibles bajo el modelo candidato. También queda demostrado que existen empates con perfiles de riesgo diferentes, por lo que cualquier política posterior deberá conservar los factores originales y no solamente el score.

El uso de incertidumbre como desempate es únicamente una hipótesis metodológica. No se aprueba como política definitiva hasta validarlo contra casos representativos de priorización.

## 5. Decisiones que permanecen abiertas

No se congelan:

- fórmula definitiva;
- ponderaciones alternativas;
- umbrales P0/P1/P2/P3;
- reglas de desempate definitivas;
- tratamiento de criticidad del objetivo;
- efecto de historial de fallos;
- costo de ejecución;
- necesidad de repetición;
- agregación entre dimensiones;
- estrategia de optimización del conjunto de pruebas.

## 6. Criterio de salida

El modelo queda metodológicamente apto para pasar a una siguiente validación con casos representativos de planificación, siempre manteniendo la separación entre riesgo, resultado de calidad y scoring.

No se implementa todavía un `RiskScore` de dominio ni un servicio de producción.
