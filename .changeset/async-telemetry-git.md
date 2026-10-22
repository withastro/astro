---
'@astrojs/telemetry': patch
---

Avoids blocking Astro commands while looking up the anonymous project ID, by running `git` asynchronously.
