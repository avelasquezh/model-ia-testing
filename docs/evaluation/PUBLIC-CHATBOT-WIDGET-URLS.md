# Public URLs with chatbot widgets

Status: ACTIVE CORPUS — candidate SUTs for provider-neutral browser discovery

## Purpose

This document records public URLs known to expose or demonstrate chatbot/widget interfaces. The URLs are maintained as external SUT candidates for automatic browser discovery, locator detection and conversational execution.

These entries are discovery candidates, not proof of successful automation. A public page can change independently of this repository, and each URL must be verified by the current discovery workflow before being considered executable.

## Registered URLs

| ID | URL | Notes |
|---|---|---|
| `hubspot-crm-chatbot-builder` | https://www.hubspot.es/products/crm/chatbot-builder | Public HubSpot page related to its chatbot builder; candidate for detecting an embedded/conversational widget if present at runtime. |
| `intercom-home` | https://www.intercom.com/ | Public Intercom site; candidate for detecting an embedded chat/messaging widget if exposed in the current page state. |
| `chatbot-sample-page` | https://www.chatbot.com/help/chat-widget/sample-page/ | Existing public ChatBot.com sample page in the discovery corpus. |
| `candordesk-demo` | https://candordesk.com/demo | Existing public CandorDesk demo in the discovery corpus. |
| `sitemind-demo` | https://www.sitemind.tech/demo | Existing public SiteMind demo in the discovery corpus. |
| `querywing-demo` | https://querywing.com/demo | Existing public QueryWing demo in the discovery corpus. |

## Usage rule

The URLs in this document are evidence sources and test targets. The browser automation implementation must remain provider-neutral: it must receive a URL, inspect the rendered page, discover the launcher/composer/send/response controls, collect evidence and then attempt the configured interaction.

Do not hard-code vendor-specific selectors solely because a URL is registered here. When a site requires explicit configuration, that configuration belongs in the corresponding SUT example and must be justified by discovery evidence.
