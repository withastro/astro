---
'astro': patch
---

Fixes Astro action requests failing in `astro dev` when using the Cloudflare adapter with `prerenderEnvironment: 'node'` alongside a prerendered catch-all route such as `[...page].astro`.

Actions and other SSR POST endpoints now continue to work in dev instead of returning an HTTP 500 error.
