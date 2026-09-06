# F2 — Validación metodológica de evaluación asistida por IA

## 1. Propósito

Validar las condiciones mínimas para utilizar un modelo de IA como mecanismo de interpretación o evaluación de criterios semánticos, sin convertirlo en sustituto de la evidencia primaria.

Este incremento es un spike metodológico. No implementa un proveedor de IA, un evaluador productivo ni una política de confianza o aceptación.

## 2. Hipótesis

La IA puede ser útil cuando la evaluación requiere interpretación semántica, pero introduce una segunda fuente de incertidumbre: además de la variabilidad del chatbot evaluado existe la variabilidad del mecanismo evaluador.

Por ello, una evaluación asistida por IA debe ser reproducible y auditable mediante la identificación del evaluador, su versión/configuración, el método utilizado, la evidencia analizada y la regla que convierte su salida en un resultado.

## 3. Principio rector

La cadena debe conservarse como:

`Evidencia primaria → Análisis IA → Salida del evaluador → Regla de aceptación → Resultado`

No:

`Salida IA → Resultado`

La salida de IA es una interpretación, no evidencia primaria del comportamiento del chatbot.

## 4. Propiedades validadas

### AI-V01 — Identidad del evaluador

La evaluación debe identificar el modelo o mecanismo evaluador utilizado.

### AI-V02 — Versionado del evaluador

Debe registrarse la versión/configuración relevante del evaluador para poder distinguir evaluaciones realizadas bajo mecanismos diferentes.

### AI-V03 — Método evaluativo versionado

La instrucción, método o protocolo utilizado para interpretar la evidencia debe identificarse mediante una versión.

### AI-V04 — Evidencia de entrada trazable

La evaluación debe referenciar explícitamente las evidencias utilizadas como entrada.

### AI-V05 — Regla de aceptación explícita

La salida del modelo no debe convertirse automáticamente en `PASS`, `FAIL` o `PARTIAL`. Debe existir una regla que interprete la salida respecto al criterio.

### AI-V06 — IA no sustituye evidencia primaria

Una referencia exclusiva a evidencia generada por IA no satisface el requisito de evidencia primaria. El análisis IA debe poder enlazar con evidencia observable anterior.

### AI-V07 — Asistencia IA explícita

El resultado debe permitir identificar que la decisión fue asistida por IA.

### AI-V08 — Estados indeterminados preservados

Si el mecanismo IA no puede determinar una conclusión, puede producir `INCONCLUSIVE` o `NOT_EVALUABLE` según la regla definida. Estos estados no deben convertirse silenciosamente en `PASS` o `FAIL`.

## 5. Registro mínimo candidato

Una evaluación asistida por IA debe conservar, como mínimo:

| Campo | Propósito |
|---|---|
| `evaluatorId` | Identidad del evaluador |
| `evaluatorVersion` | Versión/configuración relevante |
| `methodVersion` | Versión del método/instrucción evaluativa |
| `inputEvidenceIds` | Evidencias utilizadas |
| `output` | Salida evaluativa |
| `acceptanceRule` | Regla de interpretación/aceptación |
| `aiAssisted` | Identificación explícita de asistencia IA |

Este registro es una estructura metodológica candidata y no constituye todavía un contrato de dominio productivo.

## 6. Separación de responsabilidades

El evaluador IA puede interpretar:

- adecuación semántica;
- relevancia;
- claridad;
- completitud;
- contradicciones observables;
- categorías definidas previamente.

No debe utilizarse únicamente para afirmar:

- arquitectura interna;
- modelo fundacional;
- prompt interno;
- RAG interno;
- base de datos interna;
- controles de seguridad no observables;
- parámetros internos de inferencia.

La limitación de observabilidad definida en F2 permanece vigente.

## 7. Relación con falsos positivos y negativos

El evaluador IA debe considerarse un instrumento sujeto a error.

Por tanto, F2-11 establece la necesidad de distinguir:

- `TRUE POSITIVE`;
- `TRUE NEGATIVE`;
- `FALSE POSITIVE`;
- `FALSE NEGATIVE`;
- `INDETERMINATE`.

La calidad del evaluador no debe confundirse con la calidad del chatbot evaluado.

## 8. Qué queda deliberadamente pendiente

Este spike no define:

- proveedor/modelo IA;
- temperatura u otros parámetros de inferencia;
- prompt productivo;
- umbral de confianza;
- F1 del evaluador como criterio de aceptación;
- tamaño mínimo de muestra;
- evaluación inter-evaluador;
- acuerdo entre evaluadores humanos y IA;
- calibración;
- intervalos de confianza;
- política de fallback humano;
- política de revisión manual.

Estas decisiones requieren evidencia adicional y pueden afectar la arquitectura del evaluador.

## 9. Criterio de salida

Queda validado que la evaluación asistida por IA requiere trazabilidad explícita del evaluador, versión, método, evidencia de entrada, salida, regla de aceptación y marca de asistencia IA, manteniendo la evidencia primaria independiente de la interpretación generada.

No se crea todavía una entidad productiva `AiEvaluator`, un proveedor concreto ni una política de confianza.
