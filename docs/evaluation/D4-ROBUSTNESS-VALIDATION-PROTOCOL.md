# D4 — Protocolo de validación empírica de robustez conversacional

**Estado:** PROTOCOLO PROPUESTO PARA VALIDACIÓN CONTROLADA
**Ámbito:** Frente 2 — D4 Robustez conversacional

## 1. Propósito

Validar empíricamente, mediante un chatbot controlado y reproducible, que los criterios D4-C01 (variación de formulación) y D4-C03 (recuperación ante entrada no prevista) pueden observarse, evidenciarse y decidirse mediante reglas explícitas.

La validación es metodológica. No constituye una conclusión sobre la robustez de un producto externo ni habilita scoring global.

## 2. Criterios bajo prueba

### D4-C01 — Variación de formulación

**Objetivo:** comprobar si entradas semánticamente equivalentes mantienen el comportamiento esperado.

**Entrada controlada:** tres formulaciones equivalentes de una misma intención.

**Esperado:** las respuestas pertenecen al mismo comportamiento funcional definido para el caso.

**Evidencia:** entrada, respuesta, orden de turno y transcript observable.

**Regla:** `PASS` cuando las tres variantes producen el comportamiento esperado; `FAIL` cuando una variante produce una desviación previamente definida.

### D4-C03 — Recuperación ante entrada no prevista

**Objetivo:** comprobar si una entrada fuera del flujo principal obtiene el comportamiento de recuperación definido.

**Entrada controlada:** solicitud no prevista dentro del escenario.

**Esperado:** respuesta segura y útil que redirija al flujo permitido sin bloquear la interacción.

**Evidencia:** entrada, respuesta y continuidad observable.

**Regla:** `PASS` cuando la respuesta coincide con la regla de recuperación definida; `FAIL` cuando abandona la regla o bloquea innecesariamente el flujo.

## 3. Diseño experimental

Se utilizan tres repeticiones independientes del mismo conjunto de casos, bajo la misma configuración y sin modificar el escenario entre repeticiones.

Cada repetición inicia una nueva sesión del chatbot controlado.

No se introduce variación deliberada en infraestructura, navegador, datos ni reglas entre repeticiones.

## 4. Caso controlado

### D4-C01

Intención: consultar el horario de atención.

Variantes:

1. `¿Cuál es el horario de atención?`
2. `Necesito saber en qué horario atienden.`
3. `¿A qué horas están disponibles?`

Respuesta esperada común: información de horario definida por el doble controlado.

### D4-C03

Entrada no prevista: `Quiero cambiar el logo de la empresa.`

Respuesta esperada: indicar que la solicitud está fuera del alcance del chatbot y orientar al canal definido, sin finalizar abruptamente la conversación.

## 5. Evidencia mínima

Cada observación debe conservar:

- identificador de repetición;
- identificador del caso;
- entrada exacta;
- respuesta observable;
- evidencia visual cuando esté disponible;
- estado de la ejecución;
- ausencia o presencia de error técnico.

## 6. Interpretación

El resultado se limita al criterio probado y a las condiciones del experimento.

No se infiere robustez general a partir de tres formulaciones ni de un único tipo de entrada no prevista.

No se agregan resultados entre dimensiones y no se convierten en una puntuación global.

## 7. Criterio de salida

El protocolo queda metodológicamente demostrado cuando:

1. los casos son reproducibles;
2. las observaciones son distinguibles y trazables;
3. la evidencia permite aplicar una regla determinista;
4. las tres repeticiones pueden compararse bajo condiciones equivalentes;
5. las limitaciones de observabilidad quedan registradas.
