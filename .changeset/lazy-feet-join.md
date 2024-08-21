---
'astro': minor
---

Adds a new option to `i18n` called `routing.fallbackType` that allows to control the fallback logic. The new option accepts
`"redirect"` or `"rewrite"`. The `"redirect"` option is the default value and matches the current behaviour of the fallback system.

The option `"rewrite"` uses the new [rewriting system](https://docs.astro.build/en/guides/routing/#rewrites), and it generates
the fallback pages based on the configuration.

For example, the following configuration will generate a page `/fr/index.html` that will contain the same HTML rendered by the page `/en/index.html`

```js
// astro.config.mjs
export default defineConfig({
  i18n: {
    locals: ["en", "fr"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
      fallbackType: "rewrite"
    },
    fallback: {
      fr: "en"
    },
  }
})
```


