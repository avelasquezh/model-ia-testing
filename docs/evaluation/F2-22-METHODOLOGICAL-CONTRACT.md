# F2-22 — Contrato metodológico de evaluación observable

**Estado:** INCREMENTO IMPLEMENTADO — pendiente de validación CI y casos controlados  
**Alcance:** Frente 2, antes de scoring global

## 1. Objetivo

Convertir la metodología observable de `F2-EVALUATION-MODEL.md` y `F2-CRITERIA-CATALOG.md` en un contrato ejecutable que impida representar como evaluable un criterio incompleto o inconsistente.

El contrato no aprueba todavía las siete dimensiones como taxonomía definitiva ni define pesos o puntuación global.

## 2. Contrato de metodología

`EvaluationMethodology` exige:

- identificador y versión de metodología;
- estado `DRAFT` o `VALIDATED`;
- al menos una dimensión;
- al menos un criterio;
- identificadores de dimensión únicos;
- identificadores de criterio únicos;
- toda referencia de criterio debe apuntar a una dimensión existente.

## 3. Contrato de dimensión

Cada dimensión debe declarar:

- `id` no vacío;
- `name` no vacío;
- `objective` no vacío.

En este incremento no se fija como definitiva la cantidad de dimensiones ni su ponderación.

## 4. Contrato de criterio

Cada criterio debe declarar:

- `id`;
- `dimensionId`;
- `type`;
- `objective`;
- al menos una precondición;
- entrada reproducible;
- comportamiento esperado;
- al menos un tipo de evidencia requerida;
- regla de decisión explícita;
- al menos una limitación;
- versión propia.

Los criterios `NUMERIC` deben declarar adicionalmente el método de medición.

## 5. Estados de evaluación

El contrato reconoce exactamente:

`PASS | FAIL | PARTIAL | INCONCLUSIVE | NOT_EVALUABLE`

Estos estados representan la conclusión de un criterio. No son niveles de puntuación y no tienen pesos implícitos.

Regla metodológica:

`Criterio + Observación + Evidencia + Regla = Resultado`

La ausencia de evidencia no se convierte automáticamente en `FAIL`.

## 6. Lo que deliberadamente no resuelve

Este gate no define todavía:

- scoring global;
- pesos por dimensión;
- compensación o no compensación de fallos en agregación;
- umbrales globales;
- modelo estadístico de repetición;
- intervalos de confianza;
- método definitivo de evaluación semántica con IA;
- fórmula de riesgo.

Esas decisiones requieren casos controlados y evidencia adicional.

## 7. Validación del incremento

La implementación queda acompañada por pruebas unitarias que comprueban:

1. aceptación de un contrato completo;
2. rechazo de referencias a dimensiones inexistentes;
3. rechazo de identificadores duplicados;
4. exigencia de método de medición para criterios numéricos;
5. exigencia de evidencia declarada.

El gate se considera validado únicamente cuando estas pruebas y el pipeline global pasan en GitHub Actions.
