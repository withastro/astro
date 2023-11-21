---
'@astrojs/vercel': minor
'@astrojs/node': minor
'astro': patch
---

Adds experimental support for a new i18n domain routing strategy (`"domain"`) that allows you to configure different domains for certain locales:

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

With `routingStrategy: "domain"` configured, the URLs for your built site, including the URLs emitted by `getAbsoluteLocaleUrl()` and `getAbsoluteLocaleUrlList()`, will follow the pattern set for each locale individually.

For any `locales` not configured in `domains`, the fallback URLs created will follow `prefix-other-locales`, and create a `/[locale]/` path for all non-default languages.

For the above configuration:

- The file `/fr/about.astro` will create the URL `https://fr.example.com/about`;
- The file `/es/about.astro` will create the URL `https://example.es/about`;
- the file `/ja/about/astro` will create the URL `https://example.com/ja/about`.
- The file `/en/about.astro` will create the URL `https://example.com/about`.
