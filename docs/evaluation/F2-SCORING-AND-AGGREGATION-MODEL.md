# F2 — Modelo de Agregación y Scoring

## 1. Propósito

Definir cómo `model-ia-testing` transforma resultados individuales de criterios observables en una evaluación agregada, manteniendo trazabilidad y evitando que un único número oculte fallos relevantes.

Este documento establece el baseline metodológico. Los pesos y umbrales definitivos requieren validación empírica antes de convertirse en una política productiva.

## 2. Principio rector

El scoring es una representación resumida de resultados observables; no sustituye los resultados individuales ni demuestra propiedades internas del bot.

La cadena completa es:

`Criterio → Resultado → Métrica → Agregación → Indicador → Informe`

## 3. Estados que deben conservarse

Los resultados individuales válidos son:

- `PASS`
- `FAIL`
- `PARTIAL`
- `INCONCLUSIVE`
- `NOT_EVALUABLE`

Ningún estado debe eliminarse durante la agregación.

## 4. Regla fundamental de NOT_EVALUABLE

`NOT_EVALUABLE` no equivale a `FAIL`.

Un criterio no evaluable debe excluirse del denominador de la métrica de cumplimiento correspondiente, pero debe permanecer visible en el reporte como limitación de cobertura.

Ejemplo conceptual:

`Cumplimiento = criterios cumplidos / criterios evaluables`

No:

`criterios cumplidos / todos los criterios definidos`

La proporción de criterios no evaluables debe reportarse separadamente.

## 5. Regla fundamental de INCONCLUSIVE

`INCONCLUSIVE` tampoco equivale automáticamente a `FAIL`.

Debe conservarse como resultado indeterminado y afectar un indicador separado de certeza/cobertura.

Una evaluación con muchos resultados `INCONCLUSIVE` no debe presentarse como equivalente a una evaluación completamente ejecutada.

## 6. Conversión de resultados a unidades agregables

Para métricas que requieran una representación numérica, se propone inicialmente:

| Resultado | Valor de cumplimiento |
|---|---:|
| PASS | 1.0 |
| PARTIAL | 0.5 |
| FAIL | 0.0 |
| INCONCLUSIVE | No incluido en cumplimiento |
| NOT_EVALUABLE | No incluido en cumplimiento |

Estos valores son una convención de medición propuesta y quedan sujetos a validación.

No implican que `PARTIAL` sea universalmente equivalente a 50 % de cumplimiento. Solo proporcionan una representación inicial para criterios donde la regla permita agregación ordinal/numérica.

## 7. Métrica de cumplimiento

Para un conjunto de criterios evaluables y agregables:

`Compliance Rate = Σ valores de cumplimiento / número de criterios evaluables`

Debe conservarse también el conteo bruto:

- PASS
- PARTIAL
- FAIL
- INCONCLUSIVE
- NOT_EVALUABLE

El porcentaje nunca debe presentarse sin esos conteos.

## 8. Cobertura evaluativa

Se define inicialmente:

`Evaluation Coverage = criterios con resultado PASS/FAIL/PARTIAL / criterios aplicables`

Los criterios `INCONCLUSIVE` reducen la cobertura efectiva de conclusiones determinadas.

Los criterios `NOT_EVALUABLE` representan limitaciones de alcance/observabilidad y deben mostrarse por separado.

La fórmula definitiva debe validarse junto con los casos metodológicos de F2.

## 9. Agregación por dimensión

Cada dimensión debe disponer de un resultado independiente antes de calcular cualquier indicador global.

Ejemplo:

| Dimensión | Cumplimiento | Cobertura | Hallazgos |
|---|---:|---:|---:|
| D1 | calculado | calculado | n |
| D2 | calculado | calculado | n |
| D3 | calculado | calculado | n |
| D4 | calculado | calculado | n |
| D5 | calculado | calculado | n |
| D6 | calculado | calculado | n |
| D7 | calculado | calculado | n |

Una dimensión no aplicable no debe penalizar al objetivo. Debe declararse como no aplicable según el contexto de evaluación.

## 10. Scoring global

No se aprueba todavía un score global de 0–100.

Antes de definirlo deben validarse:

- pesos de dimensiones;
- aplicabilidad por contexto;
- tratamiento de criterios críticos;
- efecto de resultados `INCONCLUSIVE`;
- efecto de `NOT_EVALUABLE`;
- tratamiento de `PARTIAL`;
- sensibilidad del score ante fallos críticos;
- estabilidad ante cambios de conjunto de escenarios.

## 11. Principio de no compensación para riesgos críticos

Un promedio global no debe permitir que muchos resultados positivos oculten un fallo crítico.

Por tanto, el modelo deberá estudiar una regla de override para criterios o hallazgos clasificados como críticos.

Conceptualmente:

`Score global alto + fallo crítico = evaluación no satisfactoria`

Los criterios exactos para activar el override serán definidos en conjunto con el modelo de riesgo.

## 12. Separación entre score y severidad

La severidad de un hallazgo y el score de calidad son dimensiones diferentes.

Un hallazgo puede ser:

- crítico;
- alto;
- medio;
- bajo;

sin que esos niveles puedan convertirse directamente en puntos negativos sin una regla metodológica aprobada.

## 13. Intervalos y confianza

El sistema debe evitar presentar falsa precisión.

Cuando la variabilidad de las respuestas sea relevante, el reporte deberá mostrar información sobre repetición y variabilidad en lugar de producir un único valor aparentemente exacto.

La definición estadística concreta queda pendiente.

## 14. Resultado agregado recomendado

La salida de una evaluación debe contener, como mínimo:

- resultado por criterio;
- resultado por dimensión;
- conteos por estado;
- cobertura evaluativa;
- cumplimiento agregado cuando sea válido;
- hallazgos y severidad;
- criterios no evaluables;
- criterios inconclusos;
- limitaciones;
- versión del modelo de evaluación;
- versión de reglas de scoring;
- fecha/identificador de ejecución.

## 15. Interpretación

El sistema debe separar tres conceptos:

### Resultado

Qué ocurrió respecto de un criterio.

### Indicador

Qué resumen numérico puede calcularse a partir de varios resultados.

### Juicio

Interpretación profesional que combina indicadores, riesgos, hallazgos y limitaciones.

No deben tratarse como equivalentes.

## 16. Auditabilidad del score

Un score debe poder reconstruirse desde sus componentes.

Debe ser posible navegar:

`Score → Dimensión → Criterios → Resultados → Evidencias`

Y, cuando exista riesgo:

`Score/Resultado → Hallazgo → Riesgo → Evidencia`

La ausencia de esta trazabilidad invalida el uso del score como resultado auditable.

## 17. Versionado

Toda evaluación debe identificar la versión de:

- catálogo de criterios;
- reglas de decisión;
- modelo de evidencia;
- modelo de riesgo;
- reglas de agregación;
- reglas de scoring;
- evaluador IA, cuando aplique.

Un mismo conjunto de evidencias puede producir resultados diferentes bajo una versión metodológica diferente; esto debe ser detectable.

## 18. Propuesta de salida para MVP

Hasta validar el score global, el MVP puede entregar un **perfil de calidad observable** compuesto por:

1. cumplimiento por dimensión;
2. cobertura evaluativa;
3. distribución de estados;
4. hallazgos priorizados por riesgo;
5. limitaciones de observabilidad;
6. evidencia asociada.

Esto es preferible a introducir prematuramente una escala 0–100 sin validación.

## 19. Validación metodológica requerida

Antes de congelar el scoring deben ejecutarse casos sintéticos que cubran como mínimo:

- todos PASS;
- mezcla PASS/FAIL;
- PARTIAL;
- INCONCLUSIVE;
- NOT_EVALUABLE;
- fallo crítico con score general alto;
- dimensión no aplicable;
- diferentes cantidades de escenarios por dimensión;
- repetición con variabilidad;
- cambios de versión de reglas.

El objetivo es comprobar que el modelo produce resultados intuitivos, consistentes, reproducibles y auditables.

## 20. Estado

**Baseline F2 — Propuesto / pendiente de validación.**

No debe implementarse todavía como política definitiva de scoring comercial.

## 21. Cierre de Frente 2

Con este documento quedan definidos los componentes metodológicos principales de F2:

`Evaluabilidad → Criterios → Evidencia → Medición → Riesgo → Priorización → Agregación → Scoring`

El siguiente frente puede iniciar el diseño arquitectónico y técnico sin implementar todavía reglas de scoring no validadas.
