---
'@astrojs/vue-renderer': patch
---

Fixes dev SSR loading two copies of `@vue/runtime-core` in server environments that pre-bundle dependencies (e.g. `astro dev` with `@astrojs/cloudflare`), which crashed components rendering slots (reka-ui: `Cannot read properties of null (reading 'ce')`). `vue/server-renderer` is now pre-bundled together with `vue`, so they share one runtime copy.
