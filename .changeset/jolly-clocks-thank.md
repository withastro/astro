---
'astro': patch
---

Fixes the `security.checkOrigin` check so it is applied consistently to Astro Actions and on-demand endpoints, regardless of how the request pipeline is composed. Previously, the origin check could be skipped in the composable `astro/hono` pipeline depending on the order of the `middleware()` primitive (or when it was omitted).
