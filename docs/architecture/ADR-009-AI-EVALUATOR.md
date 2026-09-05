# ADR-009 — IA como evaluador asistido

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05

## Contexto

El sistema puede necesitar interpretación semántica para evaluar respuestas conversacionales. El modelo F2 establece que la IA puede asistir en clasificación, comparación semántica, detección de contradicciones y análisis exploratorio, pero no reemplaza la evidencia primaria.

## Decisión propuesta

La IA será un **adaptador opcional** detrás de un puerto de evaluación semántica.

Los criterios deterministas deberán resolverse mediante reglas deterministas cuando sea suficiente. La IA se utilizará únicamente cuando el criterio requiera interpretación que no pueda resolverse de forma fiable mediante comparación directa.

Cada evaluación asistida deberá registrar:

- modelo/proveedor;
- versión o identificador disponible;
- configuración relevante;
- entrada/evidencia utilizada;
- instrucción o método versionado;
- salida;
- regla de aceptación;
- indicación de que fue asistida por IA.

## Prohibición arquitectónica

La salida de un modelo no constituye evidencia primaria. Una conclusión no podrá afirmar propiedades internas no observables del chatbot objetivo.

## Alternativas

### IA obligatoria para todos los criterios

No recomendada: aumenta costo, variabilidad y superficie de incertidumbre sin necesidad.

### Evaluación totalmente determinista

No suficiente para criterios semánticos complejos.

## Patrones

- Strategy para distintos evaluadores.
- Adapter para proveedores/modelos.
- Dependency Inversion para aislar el dominio.
- Chain of Responsibility es candidato futuro si varios evaluadores se aplican por prioridad, pero no se adopta todavía.

## Criterios de validación

1. El dominio funciona sin proveedor de IA.
2. Puede sustituirse el proveedor mediante un adaptador.
3. Las entradas de IA son trazables a evidencia.
4. La salida de IA no se registra como evidencia primaria.
5. Las pruebas pueden usar un evaluador determinista falso/mock.
6. Un cambio de modelo puede identificarse en los resultados.

## Estado

**Propuesta.** El proveedor/modelo concreto se decidirá únicamente después de validar necesidades, costo, privacidad, reproducibilidad y calidad de evaluación.
