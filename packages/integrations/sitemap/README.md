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

`@astrojs/sitemap` requires a deployment / site URL for generation. Add your site's URL under your `astro.config.*` using the `buildOptions.site` property:

__astro.config.mjs__

```js
import sitemap from '@astrojs/sitemap';

export default {
  // ...
  buildOptions: {
    site: 'https://stargazers.club',
  },
  integrations: [sitemap()],
}
```

Now, [build your site for production](https://docs.astro.build/en/reference/cli-reference/#astro-build) via the `astro build` command. You should find your sitemap under `dist/sitemap.xml`!

You can also check our [Astro Integration Documentation][astro-integration] for more on integrations.

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/
[astro-ui-frameworks]: https://docs.astro.build/en/core-concepts/framework-components/#using-framework-components
