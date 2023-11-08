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
            locales: ["en", "es", "pt_BR"]
        }
    }
})
```

Organize your content folders by locale, including your `defaultLocale` and `src/pages/index.astro` will now automatically default to the `index.astro` file of your default language.

```
├── src
│   ├── pages
│   │   ├── en
│   │   │   ├── about.astro
│   │   │   ├── index.astro
│   │   ├── es
│   │   │   ├── about.astro
│   │   │   ├── index.astro
│   │   ├── pt_BR
│   │   │   ├── about.astro
│   │   │   ├── index.astro
│   ├── index.astro

```

Compute relative URLs for your links with `getLocaleRelativeURL` from the new `astro:i18n` module:

```astro
---
import {getLocaleRelativeUrl} from "astro:i18n";
const aboutUrl = getLocaleRelativeUrl("pt_Br", "about");
---
<p>Learn more <a href={aboutURL}>About</a> this site!</p>
```

Enabling i18n routing also provides two new properties for browser language detection: `Astro.preferredLocale` and `Astro.preferredLocaleList`. These combine the browser's `Accept-Langauge` header, and your site's list of supported languages and can be used to automatically respect your visitor's preferred languages.

```astro
---
const preferredLocale = Astro.preferredLocale;
const preferredLocaleList = Astro.preferredLocaleList;
---
NEED A USAGE EXAMPLE HERE
```

Read more about Astro's [experimental i18n routing](https://docs.astro.build/en/guides/internationalization/) in our documentation.
