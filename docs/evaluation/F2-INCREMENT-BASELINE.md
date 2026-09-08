# F2 — Baseline oficial de incrementos metodológicos

**Versión de la metodología:** 0.1  
**Estado:** BASELINE RECONSTRUIDA Y CONGELADA  
**Última reconstrucción:** 2026-09-08

## Propósito

Este documento es la fuente de verdad para la secuencia metodológica del Frente 2 (F2).

La secuencia oficial del MVP de F2 comprende exactamente **35 incrementos: F2-01 a F2-35**.

Ningún incremento posterior podrá recibir un identificador `F2-36`, `F2-37`, etc. como extensión automática de esta baseline. Cualquier trabajo nuevo posterior a F2-35 debe clasificarse como extensión, validación adicional o decisión metodológica posterior, con una nomenclatura separada y sin alterar retrospectivamente la secuencia oficial.

El número de incremento identifica una pieza metodológica del plan; no representa la versión del producto, que permanece separada mediante SemVer.

## Reconstrucción

La secuencia se reconstruye a partir de la cronología histórica de `main` y de los documentos metodológicos existentes. El commit histórico que introdujo la primera gran materialización de F2 registra explícitamente F2-01 a F2-05 y, posteriormente, la cadena de trazabilidad de medición, riesgo, priorización, agregación, criticidad, falsos positivos/negativos, IA asistida, repetición, estadística y métricas antes de F2-18. La documentación posterior confirma explícitamente referencias como `F2-15 → F2-16 → F2-17` y la continuidad `F2-18 → ... → F2-35`.

Cuando un incremento histórico no conservó el número en el nombre del archivo, este documento fija el número reconstruido mediante su posición en la secuencia histórica y sus referencias cruzadas. La secuencia no debe volver a inferirse durante la implementación.

## Secuencia oficial F2-01 a F2-35

| ID | Incremento oficial | Propósito resumido |
|---|---|---|
| F2-01 | Resultado de evaluación de criterio y regla determinista de respuesta | Crear el primer resultado de criterio y su evaluación determinista. |
| F2-02 | Medición de tiempo observable | Modelar tiempos medibles desde la interacción externa. |
| F2-03 | Contrato de definición de medición | Definir qué significa una medición y cómo debe especificarse. |
| F2-04 | Contrato de observación de medición | Separar la observación concreta de su definición metodológica. |
| F2-05 | Contrato de unidad de evidencia | Formalizar la unidad mínima de evidencia trazable. |
| F2-06 | Trazabilidad de observaciones de medición | Vincular observaciones con definición de medición y evidencia. |
| F2-07 | Validación metodológica del modelo de riesgo | Validar propiedades matemáticas básicas de la fórmula candidata de riesgo. |
| F2-08 | Validación metodológica de priorización de riesgo | Validar el ordenamiento experimental por riesgo e incertidumbre. |
| F2-09 | Validación metodológica de agregación | Validar agregación de resultados sin convertirla en scoring global. |
| F2-10 | Validación de no compensación ante fallos críticos | Demostrar que un fallo crítico no queda oculto por compensación numérica. |
| F2-11 | Validación de falsos positivos y falsos negativos | Distinguir errores del mecanismo evaluador respecto de una referencia conocida. |
| F2-12 | Validación metodológica de evaluación asistida por IA | Formalizar trazabilidad y separación entre evidencia primaria y análisis IA. |
| F2-13 | Repetición y reproducibilidad | Establecer la repetición como mecanismo controlado de observación. |
| F2-14 | Tratamiento estadístico de repetición y variabilidad | Definir el tratamiento descriptivo inicial de variabilidad entre repeticiones. |
| F2-15 | Validación metodológica de métricas y unidades | Fijar el contrato de significado, unidad, fórmula y fuente de una métrica. |
| F2-16 | Validación metodológica de reglas de decisión de criterios | Definir cómo observación y evidencia producen un resultado mediante una regla versionada. |
| F2-17 | Validación de aplicabilidad y composición de criterios | Determinar qué criterios son aplicables a cada contexto. |
| F2-18 | Plan ejecutable de evaluación por contexto | Convertir la composición contextual en un plan de evaluación auditable. |
| F2-19 | Primera ejecución tangible de chatbot | Ejecutar un chatbot controlado y capturar observables reales. |
| F2-20 | Evaluación de criterio ligada a evidencia | Conectar evidencia catalogada con la evaluación del criterio. |
| F2-21 | Primera regla determinista sobre evidencia observable | Completar el ciclo evidencia observable → regla → resultado. |
| F2-22 | Contrato metodológico de evaluación observable | Hacer ejecutable el contrato global de metodología, dimensiones y criterios. |
| F2-23 | Invariantes del contexto de versionado metodológico | Garantizar reconstrucción histórica de la identidad metodológica de una ejecución. |
| F2-24 | Delimitación de dimensiones del MVP | Fijar el perímetro observable del MVP y separar núcleo de extensiones. |
| F2-25 | Selección contextual de criterios | Seleccionar explícitamente criterios por escenario, versión y contexto. |
| F2-26 | Vinculación del plan de evaluación con la ejecución | Persistir el snapshot del plan dentro de la ejecución histórica. |
| F2-27 | Repetición controlada y variabilidad observable | Modelar conjuntos de ejecuciones comparables y su distribución de resultados. |
| F2-28 | Tratamiento estadístico descriptivo de la variabilidad | Calcular distribución, tasas e incertidumbre descriptiva sin scoring. |
| F2-29 | Interpretación metodológica de indicadores estadísticos | Interpretar consistencia o variabilidad observada sin convertirla en juicio normativo. |
| F2-30 | Contrato de juicio metodológico | Separar interpretación estadística de juicio metodológico limitado. |
| F2-31 | Contrato explícito de decisión de evaluación | Permitir aceptación/rechazo únicamente mediante una regla versionada explícita. |
| F2-32 | Contrato de agregación de decisiones de evaluación | Definir la precedencia para combinar decisiones individuales. |
| F2-33 | Vinculación de la agregación con EvaluationPlan | Restringir la agregación al conjunto de criterios autorizado por el plan. |
| F2-34 | Aplicabilidad y agregación de decisiones | Excluir `NOT_APPLICABLE` de la agregación sin convertirlo en una decisión de calidad. |
| F2-35 | Cobertura metodológica de evaluación | Formalizar la cobertura descriptiva por criterio dentro de una ejecución. |

## Evidencia de la reconstrucción

### Tramo F2-01 a F2-21

La cronología histórica del commit `98af7f08dfa16bf467156cbd4513f572da667d17` registra explícitamente las operaciones de F2-01 a F2-05 y posteriormente las etapas de trazabilidad de medición, modelo/priorización de riesgo, agregación, no compensación de críticos, falsos positivos/negativos, evaluación asistida por IA, repetición, estadística y métricas. Ese mismo histórico introduce explícitamente F2-18, F2-19, F2-20 y F2-21.

El documento F2-15 declara explícitamente que F2-16 es la capa de reglas de decisión, y F2-16 declara que F2-15 define métricas y unidades. fileciteturn358file0L2-L2 fileciteturn356file0L2-L2

F2-17 declara que sigue a F2-16 y precede a F2-18. fileciteturn363file0L2-L2

### Tramo F2-22 a F2-35

Los archivos numerados actuales confirman la continuidad de F2-22 a F2-35. Ejemplos directos:

- F2-22 formaliza el contrato metodológico. fileciteturn379file0L2-L2
- F2-23 formaliza las invariantes de versionado. fileciteturn380file0L2-L2
- F2-24 fija el perímetro del MVP. fileciteturn377file0L2-L2
- F2-25 materializa la selección contextual. fileciteturn378file0L2-L2
- F2-26 vincula el plan con la ejecución. fileciteturn368file0L2-L2
- F2-27 y F2-28 cubren repetición y tratamiento estadístico descriptivo. fileciteturn364file0L2-L2 fileciteturn365file0L2-L2
- F2-29, F2-30, F2-31 y F2-32 completan la cadena interpretación → juicio → decisión → agregación. fileciteturn371file0L2-L2 fileciteturn372file0L2-L2 fileciteturn373file0L2-L2 fileciteturn374file0L2-L2
- F2-33 y F2-34 restringen la agregación al plan y a los criterios aplicables. fileciteturn375file0L2-L2 fileciteturn376file0L2-L2
- F2-35 cierra el tramo con cobertura metodológica. fileciteturn355file0L2-L2

## Regla de gobierno de la secuencia

1. **F2-01…F2-35 es la baseline oficial del MVP.**
2. No se renumeran retrospectivamente incrementos ya cerrados.
3. Un trabajo nuevo posterior a F2-35 no se incorpora automáticamente como F2-36+.
4. Una extensión posterior debe tener una nomenclatura distinta, por ejemplo `F2-EXT-01`, `F2-VAL-01` o quedar asociada al incremento original que se está validando.
5. Un cambio de alcance que afecte la baseline oficial debe registrarse como decisión metodológica explícita y versionada; no se corrige solamente cambiando nombres de archivos.
6. El estado de un incremento se registra en su documentación y en `PROJECT-STATUS.md`; el identificador no se reutiliza.
7. La versión de producto (`0.1.0`) y las versiones metodológicas permanecen independientes.

## Relación con el trabajo posterior ya materializado

Existen documentos posteriores denominados F2-36 en adelante en el estado actual de `main`, por ejemplo F2-36 de interpretación de cobertura y F2-46 de validación con Ollama. fileciteturn366file0L2-L2 fileciteturn389file0L2-L2

Esos documentos **no forman parte de la baseline oficial de 35 incrementos definida aquí**. Deben tratarse como trabajo posterior/extensión hasta que una decisión metodológica formal determine su nomenclatura definitiva. No deben utilizarse para redefinir retrospectivamente el MVP original.

## Estado de reconstrucción

**RECONSTRUIDO: 35/35 incrementos oficiales.**

La siguiente tarea metodológica no debe comenzar con un nuevo número. Primero se debe clasificar formalmente el trabajo posterior existente frente a esta baseline y actualizar la documentación de estado para que no vuelva a aparecer una secuencia improvisada.