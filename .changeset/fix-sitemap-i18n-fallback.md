---
'astro': minor
---

Adds `fallbackRoutes` to the `IntegrationResolvedRoute` type, exposing i18n fallback routes to integrations via the `astro:routes:resolved` hook for projects using `fallbackType: 'rewrite'`.

This allows integrations such as the sitemap integration to properly include generated fallback routes in their output.

```js
{
  'astro:routes:resolved': ({ routes }) => {
    for (const route of routes) {
      for (const fallback of route.fallbackRoutes) {
        console.log(fallback.pathname) // e.g. /fr/about/
      }
    }
  }
}
```
