---
'astro': minor
---

Adds experimental support for a new i18n domain routing option (`"domains"`) that allows you to configure different domains for individual locales in entirely server-rendered projects.

To enable this in your project, first configure your `server`-rendered project's i18n routing with your preferences if you have not already done so. Then, set the `experimental.i18nDomains` flag to `true` and add `i18n.domains` to map any of your supported `locales` to custom URLs:

```js
//astro.config.mjs"
import { defineConfig } from "astro/config"
export default defineConfig({
  site: "https://example.com",
  output: "server",
  adapter: node({
    mode: 'standalone',
  }),
  i18n: {
    defaultLocale: "en",
    locales: ["es", "en", "fr", "ja"],
    routing: {
      prefixDefaultLocale: false
    },
    domains: {
        fr: "https://fr.example.com",
        es: "https://example.es"
    }
  },
  experimental: {
    i18nDomains: true
  }
})
```
With `"domains"` configured, the URLs emitted by `getAbsoluteLocaleUrl()` and `getAbsoluteLocaleUrlList()` will use the options set in `i18n.domains`.

```js
import { getAbsoluteLocaleUrl  } from "astro:i18n";

getAbsoluteLocaleUrl("en", "about"); // will return "https://example.com/about"
getAbsoluteLocaleUrl("fr", "about"); // will return "https://fr.example.com/about"
getAbsoluteLocaleUrl("es", "about"); // will return "https://example.es/about"
getAbsoluteLocaleUrl("ja", "about"); // will return "https://example.com/ja/about"
```

Similarly, your localized files will create routes at corresponding URLs:

- The file `/en/about.astro` will be reachable at the URL `https://example.com/about`.
- The file `/fr/about.astro` will be reachable at the URL `https://fr.example.com/about`.
- The file `/es/about.astro` will be reachable at the URL `https://example.es/about`.
- The file `/ja/about.astro` will be reachable at the URL `https://example.com/ja/about`.

See our [Internationalization Guide](https://docs.astro.build/en/guides/internationalization/#domains-experimental) for more details and limitations on this experimental routing feature.
