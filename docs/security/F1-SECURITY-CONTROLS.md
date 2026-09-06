# Frente 1 — Controles de seguridad y límites

## Objetivo

Establecer controles verificables para la ejecución automatizada sin introducir un proveedor de identidad ficticio ni acoplar seguridad al dominio.

## Controles implementados

- REQ-F1-096: la ejecución segura puede exigir autorización explícita del `targetId` mediante `ExecutionSecurityPort`.
- REQ-F1-097: existe límite de timeout positivo y máximo mediante `ExecutionSecurityPort`; `ExecuteScenario` también valida el timeout operativo.
- REQ-F1-098: los errores técnicos de ejecución forman parte del modelo de ejecución y pueden conservarse como evidencia operacional.
- REQ-F1-099: los objetivos aceptan únicamente URLs HTTP/HTTPS y la autorización se aplica sobre el objetivo resuelto antes de ejecutar.

## Controles de configuración y secretos

- REQ-F1-094 y REQ-F1-095: el dominio y los casos de uso no leen variables de entorno directamente. La estrategia de configuración y secretos queda definida en ADR-014 y deberá materializarse en el composition root y en el despliegue.
- No se introduce ningún secreto, token o credencial de prueba en código fuente, fixtures o evidencias.

## Aislamiento

REQ-F1-093 permanece condicionado al diseño de despliegue. ADR-008 define el aislamiento de Playwright como frontera de riesgo y propone contenedor dedicado, filesystem efímero, límites de recursos y navegación controlada. La implementación concreta de esos controles no se fuerza dentro del dominio o aplicación.

## Autenticación y autorización de actores

El MVP no inventa identidad. ADR-012 establece que autenticación y autorización deberán residir en adaptadores de entrada y una política de aplicación, con mínimo privilegio. La autorización por `targetId` implementada en este incremento constituye un control de alcance del objetivo, no reemplaza la autenticación de usuarios.

## Validación

Los controles se validan mediante pruebas unitarias y de aplicación dentro del quality gate de GitHub Actions. La política de seguridad debe poder sustituirse por otra implementación sin modificar el dominio.
