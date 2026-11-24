---
'@astrojs/vue-renderer': patch
---

Fixes `Cannot read properties of null (reading 'ce')` when server-rendering Vue components that use slots (e.g. reka-ui) in `astro dev` with adapters that pre-bundle server dependencies, such as `@astrojs/cloudflare`
