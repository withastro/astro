---
"astro": minor
---

Adds a new i18n routing option `manual` to allow you to write your own i18n middleware:

```js
import { defineConfig } from "astro/config"
// astro.config.mjs
export default defineConfig({
    i18n: {
        locales: ["en", "fr"],
        defaultLocale: "fr",
        routing: "manual"
    }
})
```

Adding `routing: "manual"` to your i18n config disables Astro's own i18n middleware and provides you with helper functions to write your own: `redirectToDefaultLocale`, `notFound`, and `redirectToFallback`:

```js
// middleware.js
import { redirectToDefaultLocale } from "astro:i18n";
export const onRequest = defineMiddleware(async (context, next) => {
    if (context.url.startsWith("/about")) {
        return next()
    } else {
        return redirectToDefaultLocale(context, 302);  
    }
})
```

Also adds a `middleware` function that manually creates Astro's i18n middleware. This allows you to extend Astro's i18n routing instead of completely replacing it. Run `middleware` in combination with your own middleware, using the `sequence` utility to determine the order:

```js title="src/middleware.js"
import {defineMiddleware, sequence} from "astro:middleware";
import { middleware } from "astro:i18n"; // Astro's own i18n routing config

export const userMiddleware = defineMiddleware();

export const onRequest = sequence(
  userMiddleware,
  middleware({
    redirectToDefaultLocale: false,
    prefixDefaultLocale: true
  })
)
```
