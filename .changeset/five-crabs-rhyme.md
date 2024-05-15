---
"astro": minor
---

The `i18nDomains` routing feature introduced behind a flag in [v3.4.0](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md#430) is no longer experimental and is available for general use.

This routing option allows you to configure different domains for individual locales in entirely server-rendered projects using the [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) or [@astrojs/vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/) adapter with a `site` configured.

If you were using this feature, please remove the experimental flag from your Astro config:

```diff
import { defineConfig } from 'astro'

export default defineConfig({
-  experimental: {
-    i18nDomains: true,
-  }
})
```

If you have been waiting for stabilization before using this routing option, you can now do so. 

Please see [the internationalization docs](https://docs.astro.build/en/guides/internationalization/#domains) for more about this feature.
