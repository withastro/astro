---
"astro": minor
---


Adds a new `i18n.routing` config option `redirectToDefaultLocale` to disable automatic redirects of the root URL (`/`) to the default locale when `prefixDefaultLocale: true` is set.

In projects where every route, including the default locale, is prefixed with `/[locale]/` path, this property allows you to control whether or not `src/pages/index.astro` should automatically redirect your site visitors from `/` to `/[defaultLocale]`.

You can now opt out of this automatic redirection by setting `redirectToDefaultLocale: false`:

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
