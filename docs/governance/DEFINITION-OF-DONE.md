# Definition of Done

Un requisito se considera terminado únicamente cuando la evidencia demuestra que cumple sus criterios de aceptación.

## Criterios

- Requisito identificado y aprobado.
- Criterios de aceptación definidos.
- Gherkin creado cuando corresponda.
- Implementación terminada.
- Pruebas automatizadas aplicables implementadas.
- Trazabilidad actualizada.
- Revisión de calidad realizada.
- Patrones/principios aplicables documentados cuando corresponda.
- CI ejecutada.
- Quality gates satisfechos.
- Evidencia de validación disponible.
- Documentación actualizada cuando corresponda.
- Regresión/autoevaluación del incremento ejecutada sobre lo desarrollado previamente.
- Resultado de la regresión analizado y cualquier fallo corregido antes de autorizar continuidad.

## Criterios adicionales para Adaptive Discovery

Cuando el incremento pertenezca al flujo Adaptive de interacción con URLs públicas, el trabajo no se considera terminado por discovery aislado.

Debe existir evidencia reproducible de que:

`URL → descubrir chat → abrir chat → localizar composer → enviar "Hello" → confirmar envío → observar nueva respuesta → confirmar recepción → VERIFIED`

La aceptación exige distinguir una superficie conversacional real de falsos positivos como formularios, buscadores, registro, contacto o soporte sin conversación. `CHAT_SURFACE_FOUND` y `CANDIDATE_FOUND` son resultados intermedios.

La evidencia de recepción debe corresponder a una respuesta **nueva posterior al envío**, no a contenido estático que ya estaba presente antes de la interacción.

Cuando el incremento modifica discovery o interacción, deben conservarse pruebas de Page/Frame y widgets anidados aplicables, junto con evidencia de la ruta utilizada.

Una ejecución CI completamente verde no permite declarar terminado el frente Adaptive si `verifiedCount = 0` para el objetivo funcional que el incremento pretende cerrar.

## Regla de continuidad

La terminación de un incremento requiere una regresión satisfactoria. Un incremento no autoriza la continuidad por el solo hecho de compilar o pasar sus pruebas nuevas; debe conservar el comportamiento validado de los incrementos anteriores.

Para el frente Adaptive, la continuidad debe mantener visible la diferencia entre mejoras de discovery y mejoras funcionales de conversación. Una mejora de discovery no debe registrarse como éxito funcional hasta demostrar `VERIFIED`.

## Regla

El código por sí solo no constituye evidencia suficiente de terminación.
