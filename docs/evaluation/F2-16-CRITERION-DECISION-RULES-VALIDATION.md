# F2-16 — Validación metodológica de reglas de decisión de criterios

## 1. Propósito

Definir cómo una observación y su evidencia se transforman en un resultado de criterio sin mezclar medición, suficiencia de evidencia, interpretación y scoring global.

F2-15 definió qué significa cada métrica y su unidad. F2-16 valida ahora la capa que interpreta una observación frente a la regla específica del criterio.

## 2. Cadena de decisión

La cadena mínima queda:

`Criterio → Aplicabilidad → Evidencia requerida → Suficiencia → Observación/Medición → Regla de interpretación → Resultado`

El resultado no debe producirse antes de comprobar que el criterio aplica y que existe evidencia suficiente.

## 3. Contrato mínimo de una regla

Una regla de decisión debe identificar:

- `criterionId`;
- tipo de criterio (`BOOLEAN`, `ORDINAL`, `NUMERIC`, `COMPARATIVE`);
- versión de la regla;
- condición de aplicabilidad;
- evidencia requerida;
- interpretación esperada;
- resultados permitidos.

La regla debe ser versionable de forma independiente de la ejecución.

## 4. Orden de evaluación

Se valida el siguiente orden lógico:

1. Determinar si el criterio es aplicable al contexto.
2. Determinar si la evidencia requerida está disponible.
3. Determinar si la evidencia es suficiente para una conclusión.
4. Interpretar la observación según la regla del criterio.
5. Emitir el resultado permitido por la regla.

Una regla de interpretación no puede convertir ausencia de evidencia en `FAIL`.

## 5. Diferencia entre INCONCLUSIVE y NOT_EVALUABLE

### NOT_EVALUABLE

Debe utilizarse cuando el criterio no puede evaluarse porque no aplica o porque las condiciones/evidencias necesarias no están disponibles dentro del alcance definido.

### INCONCLUSIVE

Debe utilizarse cuando el criterio sí aplica y existe evidencia relacionada, pero esta no permite determinar el resultado con suficiente certeza.

Esta distinción conserva la semántica ya establecida en F2 y evita penalizar una limitación de observabilidad como si fuera un incumplimiento.

## 6. Reglas según tipo de criterio

### BOOLEAN

La regla debe definir qué condición observable equivale a `PASS` y qué evidencia suficiente permite declarar `FAIL`.

Ejemplo:

`PASS = todos los resultados observables esperados se satisfacen`

### ORDINAL

La regla debe definir explícitamente las categorías y su significado. No debe asumir que la distancia entre niveles ordinales representa una diferencia numérica equivalente.

`PARTIAL` solo puede utilizarse cuando el criterio haya definido una interpretación graduada.

### NUMERIC

La medición debe provenir del contrato de métrica definido en F2-15. La decisión puede utilizar un umbral específico del criterio y contexto, pero ese umbral no se convierte automáticamente en una regla universal de calidad.

Ejemplo conceptual:

`observed_value ≤ criterion_threshold → PASS`

La existencia del umbral debe quedar asociada a una versión de regla y a las condiciones de aplicación.

### COMPARATIVE

La regla debe identificar la referencia compatible, sus condiciones y el significado de la diferencia observada.

No debe declararse mejora o degradación solo porque exista una diferencia numérica.

## 7. PARTIAL

`PARTIAL` no es un resultado universal.

Debe aparecer únicamente cuando el criterio define una condición graduada que permita distinguir cumplimiento completo, incompleto e incumplimiento.

Por ejemplo, un criterio de completitud puede definir elementos esperados con distinta importancia. La regla debe documentar cómo la ausencia de elementos produce `PARTIAL` o `FAIL`.

La representación numérica provisional de `PARTIAL` definida en agregación no modifica esta regla semántica.

## 8. Ambigüedad de interpretación

Cuando la evidencia es suficiente pero la regla no permite mapear inequívocamente la observación a un resultado, el resultado debe ser `INCONCLUSIVE` y debe registrarse la razón.

No se debe seleccionar `PASS` o `FAIL` por conveniencia estadística.

## 9. Evidencia y trazabilidad

Una decisión debe poder reconstruirse como:

`Resultado → Regla/version → Observación → Evidencia → Ejecución → Escenario → Criterio`

La regla no sustituye la evidencia. La evidencia tampoco determina por sí sola el resultado sin una interpretación explícita.

## 10. Reglas específicas frente a reglas universales

F2-16 permite reglas específicas por criterio y contexto.

No autoriza todavía:

- un umbral universal para todas las métricas;
- una única regla de calidad para todas las dimensiones;
- pesos de dimensiones;
- score global 0–100;
- política comercial de aceptación;
- una regla universal de parada de repeticiones.

Esto mantiene separadas la semántica del criterio y la política de calificación.

## 11. Versionado

Un cambio que altere el significado de una decisión debe producir una nueva versión de la regla.

Debe ser posible saber bajo qué versión se obtuvo cada resultado.

La misma evidencia puede producir resultados diferentes bajo reglas metodológicas distintas; el sistema debe poder distinguir esos casos.

## 12. Implicación para IA evaluadora

La IA puede asistir la interpretación semántica, pero la regla aplicable, la evidencia utilizada, la versión del método y el resultado deben quedar identificables.

La IA no debe introducir silenciosamente una regla distinta a la declarada para el criterio.

Si la interpretación asistida no permite una decisión suficientemente sustentada, debe conservarse `INCONCLUSIVE`.

## 13. Criterio de salida

F2-16 queda validado cuando el modelo puede distinguir:

- aplicabilidad;
- disponibilidad de evidencia;
- suficiencia de evidencia;
- interpretación;
- resultado;
- versionado de la regla;

sin mezclar estas capas con scoring global.

## 14. Próximo paso

Con F2-16 validado, la siguiente capa lógica es comprobar la aplicabilidad y composición de criterios por dimensión y contexto, antes de congelar un modelo de scoring global.
