---
'astro': patch
---

Update `@astrojs/compiler` and use the new `resolvePath` option. This allows removing much of the runtime code, which should improve rendering performance for Astro and MDX pages.
