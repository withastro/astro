---
"astro": patch
---

Fixes a case where the local server would crash when the host also contained the port, eg. with `X-Forwarded-Host: hostname:8080` and `X-Forwarded-Port: 8080` headers
