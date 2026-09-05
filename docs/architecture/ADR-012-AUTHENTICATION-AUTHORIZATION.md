# ADR-012 — Autenticación y autorización

**Estado:** Propuesta para aprobación  
**Versión:** 1.0

## Contexto

El sistema administrará objetivos, escenarios, ejecuciones, evidencias y reportes. Estos recursos pueden contener información operacional sensible y deben protegerse sin introducir seguridad dentro del dominio de forma acoplada.

## Decisión

La autenticación y autorización se implementarán en los adaptadores de entrada y en una capa de aplicación/política claramente definida. El dominio no dependerá de un proveedor de identidad concreto.

La autorización deberá aplicar mínimo privilegio y verificar que el actor pueda ejecutar la operación sobre el recurso solicitado.

El diseño deberá distinguir:

- identidad/autenticación;
- autorización;
- permisos sobre recursos;
- autenticación entre componentes internos cuando aplique;
- gestión de secretos.

Las credenciales, tokens y secretos no se almacenarán en código, evidencias, logs ni archivos versionados.

## Principios y patrones

- Defense in Depth.
- Least Privilege.
- Dependency Inversion para proveedores de identidad.
- Policy-based authorization como estrategia candidata.
- Adapter para integrar el proveedor de identidad.

## MVP

La solución exacta de identidad se decidirá antes de exponer el producto públicamente. No se implementará una identidad ficticia únicamente para completar la arquitectura.

El acceso administrativo y los recursos de ejecución deberán estar protegidos antes del despliegue público.

## Criterios de validación

1. Una solicitud no autenticada no accede a recursos protegidos.
2. Un actor autenticado sin permiso recibe una respuesta de autorización consistente.
3. Las credenciales no aparecen en logs ni artefactos.
4. Los secretos son inyectados mediante mecanismos de configuración seguros.
5. Las pruebas pueden verificar autorización sin depender del proveedor real.

## Consecuencia

La seguridad de acceso queda separada del dominio y podrá evolucionar de autenticación simple a un proveedor de identidad más completo sin modificar las reglas de evaluación.
