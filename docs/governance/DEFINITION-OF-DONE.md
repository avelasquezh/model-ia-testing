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

## Regla de continuidad

La terminación de un incremento requiere una regresión satisfactoria. Un incremento no autoriza la continuidad por el solo hecho de compilar o pasar sus pruebas nuevas; debe conservar el comportamiento validado de los incrementos anteriores.

## Regla

El código por sí solo no constituye evidencia suficiente de terminación.
