---
'astro': patch
---

Fixes an issue that would break `Astro.request.url` and `Astro.request.headers` in `astro dev` if HTTP/2 was enabled.

HTTP/2 is now enabled by default in `astro dev` if `https` is configured in the Vite config.
