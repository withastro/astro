---
'astro': patch
---

Fixes content collection HMR when using `@astrojs/cloudflare` with `prerenderEnvironment: 'node'`. Editing a markdown file in a content collection now correctly refreshes slug pages served through the prerender environment.
