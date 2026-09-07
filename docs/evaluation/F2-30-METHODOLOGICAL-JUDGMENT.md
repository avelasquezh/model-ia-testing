# F2-30 — Contrato de juicio metodológico

**Estado:** **IMPLEMENTADO; pendiente de validación CI**

## 1. Propósito

Definir el límite entre una interpretación estadística y un juicio metodológico explícito.

F2-30 no convierte una tasa, un intervalo de Wilson ni una distribución en aceptación o rechazo del producto. Su función es establecer cuándo existe base suficiente para formular un juicio metodológico limitado y cuándo debe abstenerse.

## 2. Cadena metodológica

`Ejecución → evidencia/resultado → estadística → interpretación → juicio metodológico`

El juicio se deriva únicamente de la interpretación ya validada por F2-29.

## 3. Juicios permitidos

### `OBSERVED_CONSISTENT`

Se emite cuando F2-29 determina `CONSISTENT_OBSERVED`.

Significa que, dentro de la muestra comparable observada, los resultados evaluables fueron consistentes.

No significa corrección absoluta, ausencia de defectos ni aceptación.

### `OBSERVED_VARIABLE`

Se emite cuando F2-29 determina `VARIABLE_OBSERVED`.

Significa que, dentro de la muestra comparable observada, coexistieron al menos dos resultados evaluables diferentes.

No significa automáticamente fallo, defecto reproducible ni comportamiento inaceptable.

### `NO_JUDGMENT`

Se emite cuando F2-29 determina `NON_COMPARABLE` o `NO_EVALUABLE_OBSERVATION`.

El sistema no dispone de base metodológica suficiente para producir un juicio de comportamiento comparable.

## 4. Regla de derivación

La derivación es determinista:

- `NON_COMPARABLE` → `NO_JUDGMENT`;
- `NO_EVALUABLE_OBSERVATION` → `NO_JUDGMENT`;
- `CONSISTENT_OBSERVED` → `OBSERVED_CONSISTENT`;
- `VARIABLE_OBSERVED` → `OBSERVED_VARIABLE`.

No se permite ninguna regla adicional implícita basada únicamente en porcentajes, intervalos o conteos.

## 5. Base obligatoria

Cada juicio conserva una `basis` textual que explica por qué se emitió.

El juicio es derivado: no reemplaza la evidencia, las ejecuciones individuales, la distribución estadística ni la interpretación que lo originó.

## 6. Fuera de alcance

F2-30 no define:

- aceptación o rechazo del producto;
- umbrales de calidad;
- scoring;
- ponderaciones;
- reglas de parada;
- significancia estadística;
- defectos críticos;
- agregación entre dimensiones;
- políticas comerciales.

## 7. Criterio de salida

Queda definido un contrato auditable para pasar de interpretación estadística a juicio metodológico limitado, manteniendo explícita la abstención cuando no existe una base comparable/evaluable.

El siguiente incremento puede estudiar reglas de decisión de aceptación a partir de criterios explícitos, pero no debe introducirlas de manera implícita en este contrato.
