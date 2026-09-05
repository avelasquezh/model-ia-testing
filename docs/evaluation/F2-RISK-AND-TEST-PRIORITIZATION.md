# F2 — Modelo de Riesgo y Priorización de Pruebas

## 1. Propósito

Definir cómo `model-ia-testing` prioriza escenarios de prueba para obtener la mayor cobertura de riesgo observable con recursos limitados.

Este modelo determina la prioridad de ejecución; no determina por sí mismo el resultado de calidad ni el scoring final del bot evaluado.

## 2. Principio

La automatización no debe ejecutar escenarios únicamente por disponibilidad técnica. Debe seleccionar y ordenar pruebas según el riesgo asociado al comportamiento que se pretende evaluar.

Cadena:

`Objetivo → Riesgo → Escenario → Criterio → Evidencia → Resultado`

## 3. Concepto de riesgo

Para este producto, el riesgo de prueba representa la posibilidad de que un comportamiento no deseado del bot produzca un impacto relevante en el contexto de uso evaluado.

El riesgo debe basarse en información explícita del objetivo de evaluación y no en suposiciones sobre la arquitectura interna del bot.

## 4. Factores iniciales

Se consideran cuatro factores candidatos:

### R1 — Impacto

Consecuencia potencial de que el comportamiento evaluado sea incorrecto.

Escala propuesta: `1–5`.

1 = impacto bajo.
5 = impacto crítico.

### R2 — Probabilidad

Estimación de la posibilidad de que ocurra el comportamiento no deseado bajo las condiciones evaluadas.

Escala propuesta: `1–5`.

1 = poco probable.
5 = muy probable.

### R3 — Exposición

Nivel de exposición del comportamiento dentro del contexto de uso.

Escala propuesta: `1–5`.

1 = uso poco frecuente o restringido.
5 = comportamiento ampliamente expuesto.

### R4 — Incertidumbre

Nivel de incertidumbre sobre el comportamiento observable y/o sobre la suficiencia de la evidencia existente.

Escala propuesta: `1–5`.

1 = comportamiento suficientemente conocido.
5 = comportamiento altamente incierto.

## 5. Estado metodológico de la fórmula

La fórmula definitiva NO queda aprobada en esta etapa.

Se propone estudiar inicialmente:

`Risk Score = Impacto × Probabilidad × Exposición`

La incertidumbre se utilizará inicialmente como factor de priorización y no necesariamente como multiplicador del riesgo.

La razón es evitar mezclar magnitudes conceptualmente distintas antes de validar el modelo con casos reales.

## 6. Niveles de prioridad

La clasificación inicial propuesta es:

| Nivel | Prioridad | Uso |
|---|---:|---|
| P0 | Crítica | Debe ejecutarse antes de liberar una evaluación |
| P1 | Alta | Debe incluirse en el conjunto principal |
| P2 | Media | Se ejecuta cuando el presupuesto/tiempo lo permite |
| P3 | Baja | Cobertura complementaria |

Los umbrales numéricos serán definidos después de validar la fórmula.

## 7. Priorización dinámica

La prioridad puede cambiar entre ejecuciones.

Ejemplos:

- un nuevo hallazgo aumenta la prioridad de escenarios relacionados;
- una modificación del objetivo cambia el impacto;
- un escenario con alta variabilidad requiere repetición;
- una nueva evidencia reduce incertidumbre;
- un cambio en el flujo conversacional invalida parte del baseline.

El sistema debe registrar la razón de una modificación de prioridad.

## 8. Riesgo por dimensión

Cada escenario debe relacionarse con una o más dimensiones de evaluación.

Ejemplo conceptual:

| Escenario | Dimensión | Riesgo principal |
|---|---|---|
| Consulta de precio | D1 | Información incorrecta |
| Pregunta ambigua | D2 | Interpretación inadecuada |
| Cambio de tema | D3 | Pérdida de contexto |
| Solicitud contradictoria | D4 | Comportamiento inconsistente |
| Solicitud de información sensible | D5 | Respuesta insegura |
| Respuesta lenta | D6 | Degradación observable |
| Interacción con controles | D7 | Fricción de uso |

Esta relación debe ser trazable y no inferirse únicamente a partir del texto del escenario.

## 9. Riesgo y NOT_EVALUABLE

Un escenario no debe recibir una penalización por el simple hecho de que una propiedad interna no sea observable.

Si el criterio está fuera del alcance observable, debe producir `NOT_EVALUABLE`.

El riesgo puede justificar la creación de una prueba diferente que sí tenga evidencia observable, pero no convertir una propiedad no observable en un defecto.

## 10. Riesgo y INCONCLUSIVE

`INCONCLUSIVE` indica que el criterio pertenece al alcance evaluable pero la ejecución no permite determinar el resultado con suficiente confianza.

Un criterio de alta prioridad en estado `INCONCLUSIVE` debe ser candidato para:

- repetición;
- ampliación de evidencia;
- revisión de condiciones;
- ejecución de escenarios complementarios.

## 11. Priorización de escenarios

El motor de planificación deberá considerar, como mínimo:

1. prioridad de riesgo;
2. criticidad del objetivo;
3. dependencia entre escenarios;
4. cobertura de dimensiones;
5. costo estimado de ejecución;
6. historial de fallos, cuando exista;
7. incertidumbre;
8. necesidad de repetición.

La estrategia concreta de optimización queda pendiente del diseño técnico.

## 12. Requisitos de auditabilidad

Toda prioridad calculada debe poder explicar:

- factores utilizados;
- valores asignados;
- fuente de cada valor;
- fórmula/version de cálculo;
- fecha de cálculo;
- persona o mecanismo que proporcionó la información;
- resultado de prioridad.

No debe existir una prioridad opaca que no pueda reconstruirse posteriormente.

## 13. Separación entre riesgo y scoring

El riesgo responde:

> ¿Qué debemos probar primero y con qué intensidad?

El scoring responde:

> ¿Qué nivel de calidad observable alcanzó el objetivo evaluado?

Son mecanismos diferentes y deben permanecer desacoplados.

## 14. Estrategia inicial de cobertura

Para el MVP se recomienda garantizar primero:

- al menos un escenario de cada dimensión aplicable;
- todos los escenarios P0;
- todos los escenarios P1;
- repetición de criterios cuya variabilidad pueda afectar la conclusión;
- escenarios negativos y ambiguos además de los casos nominales.

Esto evita que una evaluación se concentre únicamente en happy paths.

## 15. Dependencias

Este modelo depende de:

- `F2-EVALUATION-MODEL.md` para dimensiones y estados;
- `F2-CRITERIA-CATALOG.md` para criterios;
- `F2-EVIDENCE-AND-MEASUREMENT-MODEL.md` para evidencia y medición.

## 16. Validación pendiente

Antes de implementar la fórmula definitiva deben construirse casos de prueba metodológicos que demuestren:

- consistencia de la clasificación;
- sensibilidad ante cambios de impacto;
- sensibilidad ante cambios de probabilidad;
- utilidad práctica para ordenar escenarios;
- ausencia de distorsión por dimensiones con distinta naturaleza;
- reproducibilidad del cálculo.

Hasta completar esta validación, los valores y fórmula de esta propuesta se consideran `DRAFT`.

## 17. Próximo paso de F2

El siguiente entregable será el **modelo de agregación y scoring**, pero únicamente después de validar:

`criterios → evidencia → mediciones → riesgo → resultados`

El scoring no debe ocultar resultados individuales ni convertir `NOT_EVALUABLE` en fallo.
