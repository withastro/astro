---
'@astrojs/node': minor
'astro': minor
---

Adds experimental support for a new i18n domain routing strategy (`"domains"`) that allows you to configure different domains for certain locales:

```js
// astro.config.mjs
import { defineConfig } from "astro/config"
export default defineConfig({
  i18n: {
      defaultLocale: "en",
      locales: ["es", "en", "fr"],
      domains: {
          fr: "https://fr.example.com",
          es: "https://example.es"
      },
      routing: {
        prefixDefaultLocale: true,
        strategy: "domains"
      }
  },
  experimental: {
      i18nDomains: true
  },
  site: "https://example.com",
  output: "server"
})
```

With `routing.strategy` set to `"domains"`, the URLs emitted by `getAbsoluteLocaleUrl()` and `getAbsoluteLocaleUrlList()` will use the options set in `i18n.domains`:

```js
import { getAbsoluteLocaleUrl  } from "astro:i18n";

getAbsoluteLocaleUrl("en", "about"); // will return "https://example.com/en/about"
getAbsoluteLocaleUrl("fr", "about"); // will return "https://fr.example.com/about"
getAbsoluteLocaleUrl("es", "about"); // will return "https://example.es/about"
```

For the above configuration:

- The file `/fr/about.astro` will create the URL `https://fr.example.com/about`.
- The file `/es/about.astro` will create the URL `https://example.es/about`.
- The file `/en/about.astro` will create the URL `https://example.com/en/about`.
