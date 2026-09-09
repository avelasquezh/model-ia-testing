# Public URLs with chatbot widgets

Status: ACTIVE CORPUS — candidate SUTs for provider-neutral browser discovery

## Purpose

This document records public URLs known to expose or demonstrate chatbot/widget interfaces. The URLs are maintained as external SUT candidates for automatic browser discovery, locator detection and conversational execution.

These entries are discovery candidates, not proof of successful automation. A public page can change independently of this repository, and each URL must be verified by the current discovery workflow before being considered executable.

Some public pages introduce a prerequisite before the chatbot can be used, such as cookie consent, a lead/contact form or another visible gating step. The browser layer now attempts common cookie-consent actions automatically. It must not invent personal data to bypass a business form; such gates remain an explicit execution prerequisite until a safe test dataset or deterministic configuration exists.

CAPTCHA and similar anti-automation challenges are also access gates. The browser layer may detect and report a visible challenge, but must not solve, bypass, disable or evade it.

## Registered URLs

| ID | URL | Notes |
|---|---|---|
| `hubspot-crm-chatbot-builder` | https://www.hubspot.es/products/crm/chatbot-builder | Public HubSpot page related to its chatbot builder; candidate for detecting an embedded/conversational widget if present at runtime. |
| `intercom-home` | https://www.intercom.com/ | Public Intercom site; candidate for detecting an embedded chat/messaging widget if exposed in the current page state. |
| `tagaval-baav` | https://tagaval.co/?source=BAAV | User-supplied public page candidate; query parameter retained because it may affect the rendered experience. |
| `aws-what-is-chatbot` | https://aws.amazon.com/es/what-is/chatbot/ | Public AWS educational page about chatbots; registered as a candidate and must be verified for an actual interactive widget at runtime. |
| `attio-crm-1707-25` | https://attio.com/p/crm-1707-25 | User-supplied Attio page; tracking parameters removed for reproducible testing. |
| `deepai-chat` | https://deepai.org/chat | Public DeepAI chat application; search verification currently identifies it as an AI chatbot interface. |
| `minciencias-chat-minciencias` | http://minciencias.gov.co/atencion-al-ciudadano/chat-minciencias | User-supplied public MinCiencias page for Chat MinCiencias; HTTP scheme retained exactly as supplied and requires runtime verification. |
| `universidadean-home` | https://universidadean.edu.co/ | User-supplied public Universidad EAN URL; candidate for chat discovery. Runtime must account for consent or pre-chat form gates if present. |
| `unisabana-psicologia` | https://www.unisabana.edu.co/programas/pregrados/psicologia | User-supplied Universidad de La Sabana Psicología URL; tracking parameters removed for reproducibility. Runtime must account for consent or pre-chat form gates if present. |
| `chevrolet-chevyplan` | https://www.chevrolet.com.co/chevyplan | User-supplied Chevrolet Colombia ChevyPlan URL; advertising/tracking parameters removed for reproducibility. Runtime must account for consent or pre-chat form gates if present. |
| `nequi-chat` | https://ayuda.nequi.com.co/hc/es/articles/35183204377229--C%C3%B3mo-chatear-con-Nequi | User-supplied Nequi help article; runtime must verify the current chat entry point and any consent or pre-chat gate. |
| `compensar-asesorvirtual` | https://corporativo.compensar.com/asesorvirtual | User-supplied Compensar Asesor Virtual page; runtime must verify the current chat entry point and any access gate. |
| `enel-chat-atencion` | https://www.enel.com.co/es/personas/chat-de-atencion.html | User-supplied Enel Colombia chat page; runtime must verify cookies, form gates and the active chat interface. |
| `nuevaeps-canales-atencion` | https://nuevaeps.com.co/coronavirus-atencion/canales-de-atencion | User-supplied Nueva EPS channels page; runtime must verify the current channel/chat entry point and any access gate. |
| `skandia-chat-servicio` | https://www.skandia.co/chat-de-servicio | User-supplied Skandia service chat page; runtime must verify cookies, form gates and the active chat interface. |
| `epssanitas-contactanos` | https://www.epssanitas.com/usuarios/web/nuevo-portal-eps/contactanos | User-supplied EPS Sanitas contact page; CAPTCHA is a possible access blocker and must be classified, not bypassed. |
| `ucontactcloud-sdm-webchat` | https://movilidad.ucontactcloud.com/WebChat/SdmForms/?form=wc | User-supplied uContactCloud webchat entry point; runtime must verify form fields and any anti-automation gate. |
| `mintransporte-chat-virtual` | https://mintransporte.gov.co/publicaciones/8095/chat-virtual/ | User-supplied MinTransporte chat page; runtime must verify the current chat entry point and any consent or form gate. |
| `renault-formularios` | https://www.renault.com.co/formularios.html | User-supplied Renault Colombia forms page; candidate may expose a pre-chat/form flow rather than a directly available composer. |
| `tullave-canales-comunicacion` | https://www.tullaveplus.gov.co/servicio-al-ciudadano/canales-de-comunicacion | User-supplied TuLlave Plus communication channels page; runtime must verify the current chat entry point and any consent or form gate. |
| `chatbot-sample-page` | https://www.chatbot.com/help/chat-widget/sample-page/ | Existing public ChatBot.com sample page in the discovery corpus. |
| `candordesk-demo` | https://candordesk.com/demo | Existing public CandorDesk demo in the discovery corpus. |
| `sitemind-demo` | https://www.sitemind.tech/demo | Existing public SiteMind demo in the discovery corpus. |
| `querywing-demo` | https://querywing.com/demo | Existing public QueryWing demo in the discovery corpus. |

## Usage rule

The URLs in this document are evidence sources and test targets. The browser automation implementation must remain provider-neutral: it must receive a URL, inspect the rendered page, discover the launcher/composer/send/response controls, collect evidence and then attempt the configured interaction.

Before chatbot discovery, the current implementation makes a bounded attempt to dismiss common English/Spanish cookie-consent controls in the main document and loaded iframes. This is convenience automation, not a general consent bypass mechanism.

Required pre-chat forms are an access gate unless the execution provides legitimate test data through configuration. The runner must not invent personal data.

CAPTCHA and similar anti-automation challenges are access gates. The runner may detect and report them, but must not attempt to solve, bypass, disable or evade them. A CAPTCHA-gated SUT is a blocked execution outcome, not a generic locator failure.

Do not hard-code vendor-specific selectors solely because a URL is registered here. When a site requires explicit configuration or a safe test dataset, that configuration belongs in the corresponding SUT example and must be justified by discovery evidence.
