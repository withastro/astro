---
'@astrojs/vercel': minor
'@astrojs/node': minor
'astro': patch
---

Add experimental support for i18n domain routing:

```js
// astro.config.mjs
import { defineConfig } from "astro/config"
export default defineConfig({
    experimental: {
        i18n: {
            defaultLocale: "en",
            locales: ["es", "en", "fr"],
            routingStrategy: "domain",
            domains: {
                fr: "https://fr.example.com",
                es: "https://example.es"
            }
        }
    }
})
```

When this routing strategy is enabled and you run `astro build` command, the URLs emitted by `getAbsoluteLocaleUrl` and `getAbsoluteLocaleUrlList` will be different:

- `/fr/about` will become `https://fr.example.com/about`;
- `/es/about` will become `https://example.es/about`;
- `/en/about` will **stay** as is because we haven't configured any domain;
