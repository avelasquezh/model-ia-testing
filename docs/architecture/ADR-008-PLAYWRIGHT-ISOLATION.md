# ADR-008 — Aislamiento de Playwright

**Estado:** Propuesta para aprobación
**Fecha:** 2026-09-05

## Contexto

El producto navega sitios externos que no están bajo su control. El navegador es una frontera de riesgo y no debe tener privilegios innecesarios sobre el proceso principal ni sobre los recursos persistentes del sistema.

## Decisión propuesta

Ejecutar Playwright en un **entorno aislado**, preferentemente un contenedor dedicado para el MVP, con límites explícitos de red, filesystem, CPU, memoria, tiempo y artefactos.

El proceso principal se comunicará con el ejecutor mediante un puerto/adaptador definido por la aplicación. El dominio no conocerá el mecanismo de aislamiento.

## Controles mínimos

- usuario no privilegiado;
- filesystem efímero para la sesión cuando sea posible;
- límites de CPU y memoria;
- timeout global y por operación;
- control de navegación y URLs;
- límites de tamaño de artefactos;
- no exponer secretos del proceso principal al navegador;
- limpieza de contexto después de cada ejecución;
- registro de eventos operacionales relevantes.

## Alternativas

### Playwright dentro del proceso principal

Más simple, pero aumenta el acoplamiento y la superficie de impacto de un objetivo externo.

### Servicio de navegador permanente compartido

Puede mejorar reutilización, pero introduce aislamiento entre ejecuciones, gestión de sesiones y riesgos de contaminación de estado.

## Patrones

- Adapter para ocultar Playwright.
- Process Isolation para separar frontera operacional.
- Factory para creación de contextos de navegador si existen múltiples configuraciones reales.

## Criterios de validación

1. El navegador no requiere privilegios administrativos.
2. Una ejecución no puede reutilizar accidentalmente cookies/estado de otra.
3. Los límites de tiempo terminan ejecuciones bloqueadas.
4. Un objetivo externo no puede escribir arbitrariamente en el filesystem persistente del producto.
5. Los artefactos salen únicamente por mecanismos controlados.

## Estado

**Propuesta.** La política exacta de red, imagen de contenedor y recursos se definirá en el diseño de despliegue y seguridad.
