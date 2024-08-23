---
'astro': minor
---

Adds a new option `fallbackType` to `i18n.routing` configuration that allows you to control how fallback pages are handled.

When `i18n.fallback` is configured, this new routing option controls whether to [redirect](https://docs.astro.build/en/guides/routing/#redirects) to the fallback page, or to [rewrite](https://docs.astro.build/en/guides/routing/#rewrites) the fallback page's content in place.

The `"redirect"` option is the default value and matches the current behavior of the existing fallback system.

The option `"rewrite"` uses the new [rewriting system](https://docs.astro.build/en/guides/routing/#rewrites) to create fallback pages that render content on the original, requested URL without a browser refresh.

For example, the following configuration will generate a page `/fr/index.html` that will contain the same HTML rendered by the page `/en/index.html` when `src/pages/fr/index.astro` does not exist.

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


