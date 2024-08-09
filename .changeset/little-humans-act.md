---
'astro': patch
---

Encrypt server island props

Server island props are not encrypted with a key generated at build-time. This is intended to prevent accidentally leaking secrets caused by exposing secrets through prop-passing. This is not intended to allow a server island to be trusted to skip authentication, or to protect against any other vulnerabilities other than secret leakage.

See the RFC for an explanation: https://github.com/withastro/roadmap/blob/server-islands/proposals/server-islands.md#props-serialization
