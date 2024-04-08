---
"astro": minor
---

Astro now allows to create your know i18n middleware:

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

When `routing: "manual"` is provided, the virtual module `astro:i18n` exports new functions:
- `redirectToDefaultLocale`
- `notFound`
- `redirectToFallback`
