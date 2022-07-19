# @astrojs/sitemap 🗺

This **[Astro integration][astro-integration]** generates a sitemap based on your routes when you build your Astro project.


- <strong>[Why Astro Sitemap](#why-astro-sitemap)</strong>
- <strong>[Installation](#installation)</strong>
- <strong>[Usage](#usage)</strong>
- <strong>[Configuration](#configuration)</strong>
- <strong>[Examples](#examples)</strong>
- <strong>[Troubleshooting](#troubleshooting)</strong>
- <strong>[Contributing](#contributing)</strong>
- <strong>[Changelog](#changelog)</strong>

## Why Astro Sitemap

A Sitemap is an XML file that outlines all of the pages, videos, and files on your site. Search engines like Google read this file to crawl your site more efficiently. [See Google's own advice on sitemaps](https://developers.google.com/search/docs/advanced/sitemaps/overview) to learn more.

A sitemap file is recommended for large multi-page sites. If you don't use a sitemap, most search engines will still be able to list your site's pages, but a sitemap is a great way to ensure that your site is as search engine friendly as possible.

With Astro Sitemap, you don't have to worry about creating this file: build your Astro site how you normally would, and the Astro Sitemap integration will crawl your routes and create the sitemap file.

## Installation

<details>
  <summary>Quick Install</summary>
  
The experimental `astro add` command-line tool automates the installation for you. Run one of the following commands in a new terminal window. (If you aren't sure which package manager you're using, run the first command.) Then, follow the prompts, and type "y" in the terminal (meaning "yes") for each one.
  
  ```sh
  # Using NPM
  npx astro add sitemap
  # Using Yarn
  yarn astro add sitemap
  # Using PNPM
  pnpx astro add sitemap
  ```
  
Then, restart the dev server by typing `CTRL-C` and then `npm run astro dev` in the terminal window that was running Astro.
  
Because this command is new, it might not properly set things up. If that happens, [feel free to log an issue on our GitHub](https://github.com/withastro/astro/issues) and try the manual installation steps below.
</details>

<details>
  <summary>Manual Install</summary>
  
First, install the `@astrojs/sitemap` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/sitemap
```
Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // ...
  integrations: [sitemap()],
})
```
  
Then, restart the dev server.
</details>

## Usage

`@astrojs/sitemap` requires a deployment / site URL for generation. Add your site's URL under your `astro.config.*` using the `site` property. This must begin with `http:` or `https:`.

__`astro.config.mjs`__

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // ...
  site: 'https://stargazers.club',
  integrations: [sitemap()],
})
```

Note that unlike other configuration options, `site` is set in the root `defineConfig` object, rather than inside the `sitemap()` call.

Now, [build your site for production](https://docs.astro.build/en/reference/cli-reference/#astro-build) via the `astro build` command. You should find your sitemap under `dist/` for both `sitemap-index.xml` and `sitemap-0.xml`!

> **Warning**
> If you forget to add a `site`, you'll get a friendly warning when you build, and the `sitemap-index.xml` file won't be generated.

<details>
<summary>Example of generated files for a two-page website</summary>

**`sitemap-index.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://stargazers.club/sitemap-0.xml</loc>
  </sitemap>
</sitemapindex>
```

**`sitemap-0.xml`**

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
</details>




## Configuration

To configure this integration, pass an object to the `sitemap()` function call in `astro.config.mjs`.

__`astro.config.mjs`__
```js
...
export default defineConfig({
  integrations: [sitemap({
    filter: ...
  })]
});
```

<details>
  <summary><strong>filter</strong></summary>
  
  All pages are included in your sitemap by default. By adding a custom `filter` function, you can filter  included pages by URL.

__`astro.config.mjs`__

```js
...
    sitemap({
      filter: (page) => page !== 'https://stargazers.club/secret-vip-lounge'
    }),
```

The function will be called for every page on your site. The `page` function parameter is the full URL of the page currently under considering, including your `site` domain. Return `true` to include the page in your sitemap, and `false` to leave it out.
  
</details>

<details>
  <summary><strong>customPages</strong></summary>
  
  In some cases, a page might be part of your deployed site but not part of your Astro project.
  If you'd like to include a page in your sitemap that _isn't_ created by Astro, you can use this option.

__`astro.config.mjs`__

```js
...
    sitemap({
      customPages: ['https://stargazers.club/external-page', 'https://stargazers.club/external-page2']
    }),
```
</details>

<details>
  <summary><strong>entryLimit</strong></summary>

The maximum number entries per sitemap file. The default value is 45000. A sitemap index and multiple sitemaps are created if you have more entries. See this [explanation of splitting up a large sitemap](https://developers.google.com/search/docs/advanced/sitemaps/large-sitemaps).

__`astro.config.mjs`__

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
</details>


<details>
  <summary><strong>changefreq</strong>, <strong>lastmod</strong>, and <strong>priority</strong></summary>

These options correspond to the `<changefreq>`, `<lastmod>`, and `<priortity>` tags in the [Sitemap XML specification.](https://www.sitemaps.org/protocol.html)

Note that `changefreq` and `priority` are ignored by Google.  

> **Note**
> Due to limitations of Astro's [Integration API](https://docs.astro.build/en/reference/integrations-reference/), this integration can't analyze a given page's source code. This configuration option can set `changefreq`, `lastmod` and `priority` on a _site-wide_ basis; see the next option **serialize** for how you can set these values on a per-page basis.

__`astro.config.mjs`__

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

</details>

<details>
  <summary>
    <strong>serialize</strong>
  </summary>

A function called for each sitemap entry just before writing to a disk. This function can be asynchronous.

It receives as its parameter a `SitemapItem` object that can have these properties:
  - `url` (absolute page URL). This is the only property that is guaranteed to be on `SitemapItem`.
  -  `changefreq` 
  - `lastmod` (ISO formatted date, `String` type) 
  - `priority` 
  - `links`. 

This `links` property contains a `LinkItem` list of alternate pages including a parent page.  

The `LinkItem` type has two fields: `url` (the fully-qualified URL for the version of this page for the specified language) and `lang` (a supported language code targeted by this version of the page).

The `serialize` function should return `SitemapItem`, touched or not.  

The example below shows the ability to add sitemap specific properties individually.

__`astro.config.mjs`__

```js
import sitemap from '@astrojs/sitemap';

export default {
  site: 'https://stargazers.club',
  integrations: [
    sitemap({
      serialize(item) {
        if (/exclude-from-sitemap/.test(item.url)) {
          return undefined;
        }
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


</details>

<details>
  <summary>
    <strong>i18n</strong>
  </summary>

To localize a sitemap, pass an object to this `i18n` option.

This object has two required properties:

- `defaultLocale`: `String`. Its value must exist as one of `locales` keys.
- `locales`:  `Record<String, String>`, key/value - pairs. The key is used to look for a locale part in a page path. The value is a language attribute, only English alphabet and hyphen allowed. 

[Read more about language attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang).

[Read more about localization](https://developers.google.com/search/docs/advanced/crawling/localized-versions#all-method-guidelines).

__`astro.config.mjs`__

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
```

<details>
  <summary>The resulting sitemap looks like this</summary>

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

</details>
</details>

## Examples
- The official Astro website uses Astro Sitemap to generate [its sitemap](https://astro.build/sitemap-index.xml).
- The [integrations playground template](https://github.com/withastro/astro/tree/latest/examples/integrations-playground?on=github) comes with Astro Sitemap installed. Try adding a route and building the project!
- [Browse projects with Astro Sitemap on GitHub](https://github.com/search?q=%22@astrojs/sitemap%22+filename:package.json&type=Code) for more examples! 

## Troubleshooting

For help, check out the `#support-threads` channel on [Discord](https://astro.build/chat). Our friendly Support Squad members are here to help!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes to this integration.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
