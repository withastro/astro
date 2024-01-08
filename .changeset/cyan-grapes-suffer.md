---
"astro": minor
---

Adds a new property inside `i18n.routing`, called `redirectToDefaultLocale`.

When `false`, Astro doesn't do a redirect from `/` to `/<defaultLocale>`. This option comes into play only
when `prefixDefaultLocale` is `true`.

```js
// astro.config.mjs
export default defineConfig({
  i18n:{
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  }
})
```
