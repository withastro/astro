---
'astro': minor
---

Add experimental support for i18n routing. Enable the routing by adding the mandatory fields to the configuration:

```js
// astro.config.mjs
import {defineConfig} from "astro/config";

export default defineConfig({
    experiemntal: {
        i18n: {
            defaultLocale: "en",
            locales: ["en", "en_AU", "es", "pt", "fr"]
        }
    }
})
```

The properties `defaultLocale` and `locales` are mandatory, and `locales` must contain the `defaultLocale`.

Now, all routes that **don't** contain a prefix (locale) in their URL will belong to the `defaultLocale`, and the translated routes will have to have a prefix in their URL: `/en_AU`, `/es`, `/pt`, `/fr`.

You have access to a new virtual module called `astro:i18n`, which exposes utility functions to create correct URLs, which are computed based on your configuration.

```astro
---
import {getLocaleRelativeUrl} from "astro:i18n";
const aboutUrl = getLocaleRelativeUrl("en_AU", "getting-started");
console.log(aboutUrl); // will log "/en-au/getting-started
---
```

You have access to two new properties in the `Astro` global: `Astro.preferredLocale` and `Astro.preferredLocaleList`. These are locales computed from the `Accept-Langauge` header, and supported by your website. You will never receive locales that aren't configured in your website.

```astro
---
const preferredLocale = Astro.preferredLocale;
const preferredLocaleList = Astro.preferredLocaleList;
---
```
