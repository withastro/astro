---
'astro': patch
---

Fixes the `security.checkOrigin` check so it is applied to Astro Actions requests consistently, regardless of how the request pipeline is composed. Previously, the origin check could be skipped for action requests depending on middleware ordering in the composable `astro/hono` pipeline.
