# D6-C01 — Protocolo de validación empírica de tiempo hasta respuesta observable

**Estado:** VALIDADO MEDIANTE EJECUCIÓN CONTROLADA  
**Ámbito:** Frente 2 — D6 Rendimiento conversacional observable

## 1. Propósito

Validar que el mecanismo de ejecución puede medir de forma reproducible el tiempo observable desde el envío de una entrada hasta la aparición de la primera respuesta del chatbot, usando una condición temporal conocida y externa.

La validación es metodológica y no constituye una afirmación sobre el rendimiento de un sistema de producción.

## 2. Criterio bajo prueba

### D6-C01 — Tiempo hasta respuesta observable

**Objetivo:** medir el tiempo transcurrido entre el inicio observable de la interacción y la primera respuesta observable.

**Condición controlada:** el doble conversacional introduce un retraso externo conocido de 80 ms antes de insertar la primera respuesta observable.

**Evidencia:** entrada, timestamps de ejecución, duración observable, respuesta y screenshot.

**Regla experimental:** cada repetición debe registrar una duración finita igual o superior a 80 ms y producir exactamente una evidencia `OBSERVATION` vinculada a su `ExecutionId`.

## 3. Diseño experimental

Se ejecutan tres repeticiones independientes sobre el mismo chatbot controlado, escenario, entrada y configuración de interfaz.

Cada repetición crea una nueva sesión de navegador. El runner cierra la sesión al finalizar la ejecución.

No se introducen variaciones deliberadas de infraestructura, reglas, escenario o configuración entre repeticiones.

## 4. Interpretación

El objetivo de esta prueba es demostrar que el tiempo observable puede medirse y conservarse como dato reproducible.

La prueba no establece por sí sola un umbral universal de calidad ni convierte la medición en un score global.

La condición de 80 ms es una condición experimental del doble controlado y no representa un SLA de producción.

## 5. Criterio de salida

El protocolo se considera demostrado cuando las tres repeticiones:

1. completan la interacción sin error técnico;
2. producen una respuesta observable conocida;
3. registran una duración finita y no negativa;
4. respetan la condición temporal controlada;
5. generan evidencia `OBSERVATION` trazable a la ejecución correspondiente.

## 6. Limitaciones

La medición representa únicamente el tiempo observable desde la interacción automatizada hasta la señal de respuesta visible. No permite inferir latencia interna del modelo, red, base de datos, infraestructura ni otras causas internas.

No se introducen scoring global, ponderaciones, causalidad ni conclusiones de rendimiento general.
