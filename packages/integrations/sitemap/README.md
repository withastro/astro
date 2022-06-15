# @astrojs/sitemap 🗺

This **[Astro integration][astro-integration]** generates a sitemap for your Astro project.

Sitemaps outline all of the pages, videos, and files on your site. Search engines like Google read this file to crawl your site more efficiently. [See Google's own advice on sitemaps](https://developers.google.com/search/docs/advanced/sitemaps/overview) to learn more.

## Installation

There are two ways to add integrations to your project. Let's try the most convenient option first!

### (experimental) `astro add` command

Astro includes a CLI tool for adding first party integrations: `astro add`. This command will:
1. (Optionally) Install all necessary dependencies and peer dependencies
2. (Also optionally) Update your `astro.config.*` file to apply this integration

To install `@astrojs/sitemap`, run the following from your project directory and follow the prompts:

```sh
# Using NPM
npx astro add sitemap
# Using Yarn
yarn astro add sitemap
# Using PNPM
pnpx astro add sitemap
```

If you run into any hiccups, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.

### Install dependencies manually

First, install the `@astrojs/sitemap` integration like so:

```
npm install @astrojs/sitemap
```

Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  // ...
  integrations: [sitemap()],
}
```

## Getting started

`@astrojs/sitemap` requires a deployment / site URL for generation. Add your site's URL under your `astro.config.*` using the `site` property:

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  // ...
  site: 'https://stargazers.club',
  integrations: [sitemap()],
}
```

Now, [build your site for production](https://docs.astro.build/en/reference/cli-reference/#astro-build) via the `astro build` command. You should find your _sitemap_ under `dist/sitemap-index.xml` and `dist/sitemap-0.xml`!

Generated sitemap content for two pages website:

**sitemap-index.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://stargazers.club/sitemap-0.xml</loc>
  </sitemap>
</sitemapindex>
```

**sitemap-0.xml**
<?xml version="1.0" encoding="UTF-8"?>

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>https://stargazers.club/</loc>
  </url>
  <url>
    <loc>https://stargazers.club/second-page/</loc>
  </url>
</urlset>
```

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Configuration

### filter

All pages are included in your sitemap by default. By adding a custom `filter`, you can filter included pages by URL.

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  site: 'https://stargazers.club',
  integrations: [
    sitemap({
      filter: (page) => page !== 'https://stargazers.club/secret-vip-lounge'
    }),
  ],
}
```

The `page` function parameter is the full URL of your rendered page, including your `site` domain. Return `true` to include a page in your sitemap, and `false` to remove it.

### canonicalURL

If present, we use the `site` config option as the base for all sitemap URLs. Use `canonicalURL` to override this.

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  site: 'https://stargazers.club',
  integrations: [
    sitemap({
      // https://astronaut.party will be used for all sitemap URLs instead
      canonicalURL: 'https://astronaut.party',
    }),
  ],
}
```

### entryLimit

Non-negative `Number` of entries per sitemap file. Default value is 45000. A sitemap index and multiple sitemaps are created if you have more entries. See explanation on [Google](https://developers.google.com/search/docs/advanced/sitemaps/large-sitemaps).

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  site: 'https://stargazers.club',
  integrations: [
    sitemap({
      entryLimit: 10000,
    }),
  ],
}
```

### changefreq, lastmod, priority

`changefreq` - How frequently the page is likely to change. Available values: `always` \| `hourly` \| `daily` \| `weekly` \| `monthly` \| `yearly` \| `never`.    

`priority` - The priority of this URL relative to other URLs on your site. Valid values range from 0.0 to 1.0.  

`lastmod` - The date of page last modification.  

`changefreq` and `priority` are ignored by Google.  

See detailed explanation of sitemap specific options on [sitemap.org](https://www.sitemaps.org/protocol.html).  


:exclamation: This integration uses 'astro:build:done' hook. The hook exposes generated page paths only. So with present version of Astro the integration has no abilities to analyze a page source, frontmatter etc. The integration can add `changefreq`, `lastmod` and `priority` attributes only in a batch or nothing.

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  site: 'https://stargazers.club',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date('2022-02-24'),
    }),
  ],
}
```

### serialize

Async or sync function called for each sitemap entry just before writing to a disk.  

It receives as parameter `SitemapItem` object which consists of `url` (required, absolute page URL) and optional `changefreq`, `lastmod`, `priority` and `links` properties.  

Optional `links` property contains a `LinkItem` list of alternate pages including a parent page.  
`LinkItem` type has two required fields: `url` (the fully-qualified URL for the version of this page for the specified language) and `hreflang` (a supported language code targeted by this version of the page).

`serialize` function should return `SitemapItem`, touched or not.

The example below shows the ability to add the sitemap specific properties individually.

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  site: 'https://stargazers.club',
  integrations: [
    sitemap({
      serialize(item) {
        if (/your-special-page/.test(item.url)) {
          item.changefreq = 'daily';
          item.lastmod = new Date();
          item.priority = 0.9;
        }
        return item;
      },
    }),
  ],
}
```

### i18n

To localize a sitemap you should supply the integration config with the `i18n` option. The integration will check generated page paths on presence of locale keys in paths.

`i18n` object has two required properties:

- `defaultLocale`: `String`. Its value must exist as one of `locales` keys.
- `locales`:  `Record<String, String>`, key/value - pairs. The key is used to look for a locale part in a page path. The value is a language attribute, only English alphabet and hyphen allowed. See more about language attribute on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang).


Read more about localization on Google in [Advanced SEO](https://developers.google.com/search/docs/advanced/crawling/localized-versions#all-method-guidelines).

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  site: 'https://stargazers.club',
  integrations: [
    sitemap({  
      i18n: {
        defaultLocale: 'en',   // All urls that don't contain `es` or `fr` after `https://stargazers.club/` will be treated as default locale, i.e. `en`
        locales: {
          en: 'en-US',         // The `defaultLocale` value must present in `locales` keys
          es: 'es-ES',
          fr: 'fr-CA',
        },
      },
    }),
  ],
};
...

```

The sitemap content will be:

```xml
...
  <url>
    <loc>https://stargazers.club/</loc>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://stargazers.club/"/>
    <xhtml:link rel="alternate" hreflang="es-ES" href="https://stargazers.club/es/"/>
    <xhtml:link rel="alternate" hreflang="fr-CA" href="https://stargazers.club/fr/"/>
  </url>
  <url>
    <loc>https://stargazers.club/es/</loc>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://stargazers.club/"/>
    <xhtml:link rel="alternate" hreflang="es-ES" href="https://stargazers.club/es/"/>
    <xhtml:link rel="alternate" hreflang="fr-CA" href="https://stargazers.club/fr/"/>
  </url>
  <url>
    <loc>https://stargazers.club/fr/</loc>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://stargazers.club/"/>
    <xhtml:link rel="alternate" hreflang="es-ES" href="https://stargazers.club/es/"/>
    <xhtml:link rel="alternate" hreflang="fr-CA" href="https://stargazers.club/fr/"/>
  </url>
  <url>
    <loc>https://stargazers.club/es/second-page/</loc>
    <xhtml:link rel="alternate" hreflang="es-ES" href="https://stargazers.club/es/second-page/"/>
    <xhtml:link rel="alternate" hreflang="fr-CA" href="https://stargazers.club/fr/second-page/"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://stargazers.club/second-page/"/>
  </url>
...
```

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
