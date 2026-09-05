# ADR-014 — Configuración y secretos

**Estado:** Propuesta para aprobación  
**Versión:** 1.0

## Contexto

El sistema tendrá configuraciones diferentes entre desarrollo, CI y despliegue. También necesitará credenciales para servicios externos y eventualmente proveedores de IA.

## Decisión

La configuración será externa al código y se resolverá en el borde de infraestructura/composición de dependencias.

Se distinguirán:

- configuración no sensible;
- secretos sensibles;
- valores derivados o temporales.

Los secretos deberán provenir de mecanismos seguros del entorno de ejecución o CI/CD. Nunca deberán formar parte del repositorio, imágenes de contenedor, fixtures, logs o evidencias.

La aplicación recibirá configuración mediante una interfaz tipada/validada, evitando que cualquier módulo lea variables de entorno directamente.

## Principios y patrones

- Twelve-Factor App como referencia para configuración externa.
- Dependency Inversion.
- Configuration Object / typed configuration.
- Composition Root para resolver dependencias y configuración.
- Fail Fast para configuración inválida o incompleta.

## Criterios de validación

1. La aplicación falla de forma explícita ante configuración obligatoria inválida.
2. El dominio no lee variables de entorno.
3. Los secretos no están presentes en Git.
4. CI puede proporcionar configuración segura sin modificar código.
5. La configuración efectiva de una ejecución relevante puede quedar registrada sin revelar secretos.

## Consecuencia

Se mejora reproducibilidad entre entornos y se reduce el riesgo de filtración de credenciales o acoplamiento de la aplicación al entorno de ejecución.
