---
layout: ~/layouts/MainLayout.astro
title: Configuration Reference
---

To configure Astro, add an `astro.config.mjs` file to the root of your project.

```js
export default /** @type {import('astro').AstroUserConfig} */ ({
  // all options are optional; these values are the defaults
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
  vite: {},
});
```

#### projectRoot

The `projectRoot` option sets the working directory used by Astro. Astro will resolve all other directory options from this path.

**Default**: The current working directory.

#### public

The `public` option sets the directory used to resolve public assets. Astro does not process any files within this directory.

**Default**: The `public` directory within the `projectRoot` directory.

#### dist

The `dist` option sets the directory used to output the final build of the project. Contents of the `public` directory are also copied into this directory.

**Default**: The `dist` directory within the `projectRoot` directory.

#### src

The `src` option sets the directory used to resolve source files, like `pages`. Astro may process, optimize, and bundle any files in this directory.

**Default**: The `src` directory within the `projectRoot` directory.

#### pages

The `pages` option sets the directory used to resolve pages, relative to the `src` option.

**Default**: The `pages` directory within the `src` directory.

#### renderers

The `renderers` option defines the framework renderers to be used by Astro.

**Default**: An array of `@astrojs/renderer-svelte`, `@astrojs/renderer-vue`, `@astrojs/renderer-react`, and `@astrojs/renderer-preact`. To assign no renderers at all, you must provide an empty array (`[]`).

#### buildOptions

The `buildOptions` option configures how a site is built, including its base URL (`buildOptions.site`), whether it includes a sitemap (`buildOptions.sitemap`), whether markdown draft pages should be included in the build (`buildOptions.drafts`), and whether its pages should be files (`path.html`) or directories (`path/index.html`) (`buildOptions.pageUrlFormat`).

#### devOptions

The `devOptions` option configures features used during development, including the server hostname (`devOptions.hostname`), the server port (`devOptions.port`), and whether urls should include a trailing slash (`devOptions.trailingSlash`).

#### vite

The `vite` option configures the internals of Vite. These options can be explored on [ViteJS.dev](https://vitejs.dev/config/).

#### markdownOptions

The `markdownOptions` option assigns options to the Markdown parser. These options can be explored on [GitHub](https://github.com/withastro/astro/blob/latest/packages/astro/src/@types/astro.ts).

---

You can view the entire configuration API on [GitHub](https://github.com/withastro/astro/blob/latest/packages/astro/src/@types/astro.ts).
