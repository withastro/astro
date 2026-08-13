---
'astro': patch
---

Fixes `Astro.site` always being `undefined` when rendering components via the Container API, even when `site` is set in `astroConfig`
