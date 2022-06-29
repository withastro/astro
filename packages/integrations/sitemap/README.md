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
  <br/>
  
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

<br/>
  
First, install the `@astrojs/sitemap` package using your package manager. If you're using npm or aren't sure, run this in the terminal:
```sh
npm install @astrojs/sitemap
```
Then, apply this integration to your `astro.config.*` file using the `integrations` property:

__astro.config.mjs__

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

__astro.config.mjs__

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

Now, [build your site for production](https://docs.astro.build/en/reference/cli-reference/#astro-build) via the `astro build` command. You should find your sitemap under `dist/sitemap.xml`!

> **Warning**
> If you forget to add a `site`, you'll get a friendly warning when you build, and the `sitemap.xml` file won't be generated.

## Configuration

To configure this integration, pass an object to the `sitemap()` function call in `astro.config.mjs`.

__astro.config.mjs__
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
  
  <br/>
  
  All pages are included in your sitemap by default. By adding a custom `filter` function, you can filter  included pages by URL.

__astro.config.mjs__

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
  
  <br/>
  
  In some cases, a page might be part of your deployed site but not part of your Astro project.
  If you'd like to include a page in your sitemap that _isn't_ created by Astro, you can use this option.

__astro.config.mjs__

```js
...
    sitemap({
      customPages: ['https://stargazers.club/external-page', 'https://stargazers.club/external-page2']
    }),
```
</details>

## Examples
- The official Astro website uses Astro Sitemap to generate [its sitemap](https://astro.build/sitemap.xml).
- The [integrations playground template](https://github.com/withastro/astro/tree/latest/examples/integrations-playground?on=github) comes with Astro Sitemap installed. Try adding a route and building the project!
- [Browse projects with Astro Sitemap on GitHub](https://github.com/search?q=%22@astrojs/sitemap%22+filename:package.json&type=Code) for more examples! 

## Troubleshooting

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR!

## Changelog

[astro-integration]: https://docs.astro.build/en/guides/integrations-guide/