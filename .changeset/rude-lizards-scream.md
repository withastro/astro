---
'astro': minor
---

Experimental support for i18n routing. 

Astro's experimental i18n routing allows you to add your multilingual content with support for configuring a default language and URL path convention, computing relative page URLs, and accepting preferred languages provided by your visitor's browser browser.

Enable the experimental routing option by adding an `i18n` object to your Astro configuration with a default location and a list of all languages to support:

```js
// astro.config.mjs
import {defineConfig} from "astro/config";

export default defineConfig({
    experimental: {
        i18n: {
            defaultLocale: "en",
            locales: ["en", "es", "pt-br"]
        }
    }
})
```

Organize your content folders by locale depending on your `i18n.routingStrategy`, and Astro will handle generating your routes and showing your preferred URLs to your visitors.
```
├── src
│   ├── pages
│   │   ├── about.astro
│   │   ├── index.astro
│   │   ├── es
│   │   │   ├── about.astro
│   │   │   ├── index.astro
│   │   ├── pt-br
│   │   │   ├── about.astro
│   │   │   ├── index.astro
```

Compute relative URLs for your links with `getLocaleRelativeURL` from the new `astro:i18n` module:

```astro
---
import {getLocaleRelativeUrl} from "astro:i18n";
const aboutUrl = getLocaleRelativeUrl("pt-br", "about");
---
<p>Learn more <a href={aboutURL}>About</a> this site!</p>
```

Enabling i18n routing also provides two new properties for browser language detection: `Astro.preferredLocale` and `Astro.preferredLocaleList`. These combine the browser's `Accept-Langauge` header, and your site's list of supported languages and can be used to automatically respect your visitor's preferred languages.

Read more about Astro's [experimental i18n routing](https://docs.astro.build/en/guides/internationalization/) in our documentation.
