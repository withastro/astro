---
'@astrojs/cloudflare': minor
---

Adds a `devEnvironment` option to the Cloudflare adapter.

By default, `astro dev` uses Cloudflare's workerd runtime for on-demand rendered routes. Set `devEnvironment` to `'node'` to run dev SSR in Astro's Node.js environment instead.
