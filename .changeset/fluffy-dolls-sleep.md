---
'astro': minor
---

Add a new way to configure the `i18n.locales` array.

Developers can now assign a custom path that can span multiple language codes:

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
      i18n: {
          defaultLocale: "english",
          locales: [
            { path: "ensligh", codes: ["en", "en-US"]}
          ],
          routingStrategy: "prefix-always"
      }
  }
})
```

With this setting, the URL of the default locale will be start with `/english`. When computing `Astro.preferredLocale`, Astro will use the `codes`.
