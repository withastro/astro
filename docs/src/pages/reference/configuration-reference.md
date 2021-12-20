---
layout: ~/layouts/MainLayout.astro
title: Configuration Reference
---

To configure Astro, add an `astro.config.mjs` file to the root of your project.

```js
export default /** @type {import('astro').AstroUserConfig} */ ({
  projectRoot: './',
  public: './public/',
  dist: './dist/',
  src: './src/',
  pages: './pages/',
  renderers: [
    '@astrojs/renderer-svelte',
    '@astrojs/renderer-vue',
    '@astrojs/renderer-react',
    '@astrojs/renderer-preact',
  ],
});
```

All settings are optional.

The `projectRoot` option sets the working directory used by Astro. All other paths will be resolved from this. By default, this is the current working directory.

The `public` option sets the directory used to resolve public assets. By default, this is the `public` directory.

The `dist` option sets the directory used to output the final build of the project.

The `src` option sets the directory used to resolve source files, like `pages`. By default, this is the `src` directory.

The `pages` option sets the directory used to resolve pages, relative to the `src` option. By default, this is the `pages` directory.

The `renderers` option assigns the framework renderers to be used by Astro. By default, Astro provides renderers for Svelte, Vue, React, and Preact. To assign no renderers at all, provide an empty array (`[]`).

The `buildOptions` option configures your site, including the site URL (`buildOptions.site`), whether it should generate a sitemap (`buildOptions.sitemap`), and whether pages should be written as `path.html` or `path/index.html` (`buildOptions.pageUrlFormat`).

The `devOptions` option configures your site for development, including the hostname (`devOptions.hostname`), the default port (`devOptions.port`), and whether urls should include a trailing slash (`devOptions.trailingSlash`).

The `vite` option configures the internals of Vite. These options can be explored on [ViteJS.dev](https://vitejs.dev/config/).

The `markdownOptions` option assigns options to the Markdown parser. These options can be explored on [GitHub](https://github.com/withastro/astro/blob/latest/packages/astro/src/@types/astro.ts).

You can view the full configuration API (including information about default configuration) on [GitHub](https://github.com/withastro/astro/blob/latest/packages/astro/src/@types/astro.ts).
