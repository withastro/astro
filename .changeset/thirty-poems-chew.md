---
"astro": minor
---

Enables type checking for JavaScript files when using the `strictest` TS config. This ensures consistency with Astro's other TS configs, and fixes type checking for integrations like Astro DB when using an `astro.config.mjs`.

If you are currently using the `strictest` preset and would like to still disable `.js` files, set `allowJS: false` in your `tsconfig.json`.
