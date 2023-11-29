---
'astro': minor
---

Adds a new way to configure the `i18n.locales` array.

Developers can now assign a custom URL path prefix that can span multiple language codes:

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
      i18n: {
          defaultLocale: "english",
          locales: [
            "de",
            { path: "english", codes: ["en", "en-US"]},
            "fr",
          ],
          routingStrategy: "prefix-always"
      }
  }
})
```

With the above configuration, the URL prefix of the default locale will be `/english/`. When computing `Astro.preferredLocale`, Astro will use the `codes`.
