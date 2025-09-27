---
'astro': major
---

Changes the default routing configuration value of `i18n.routing.redirectToDefaultLocale` from `true` to `false`.

In Astro v5.0, `i18n.routing.redirectToDefaultLocale` was `true` by default. When combined with the `i18n.routing.prefixDefaultLocale` default value of `false`, the resulting redirects could cause infinite loops.

In Astro v6.0, `i18n.routing.redirectToDefaultLocale` now defaults to `false`. Additionally, it can now only be used if `i18n.routing.prefixDefaultLocale` is set to `true`.

#### What should I do?

Review your Astro `i18n` config as you may now need to explicitly set values for `redirectToDefaultLocale` and `prefixDefaultLocale` to recreate your project's previous behavior.

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  i18n: {
    routing: {
      prefixDefaultLocale: true,
+      redirectToDefaultLocale: true
    }
  }
})
```
