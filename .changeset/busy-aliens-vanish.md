---
'astro': patch
---

Fixes `Astro.logger` producing no output when using non-Node adapters (e.g. `@astrojs/cloudflare`) in dev mode
