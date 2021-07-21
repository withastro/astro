---
layout: ~/layouts/Main.astro
title: Configuration Reference
---

To configure Astro, add an `astro.config.mjs` file in the root of your project. All settings are optional. Here are the defaults:

```js
export default {
  projectRoot: '.', // Where to resolve all URLs relative to. Useful if you have a monorepo project.
  src: './src', // Path to Astro components, pages, and data
  pages: './src/pages', // Path to Astro/Markdown pages
  dist: './dist', // When running `astro build`, path to final static output
  public: './public', // A folder of static files Astro will copy to the root. Useful for favicons, images, and other files that don’t need processing.
  buildOptions: {
    // site: '',            // Your public domain, e.g.: https://my-site.dev/. Used to generate sitemaps and canonical URLs.
    sitemap: true, // Generate sitemap (set to "false" to disable)
  },
  devOptions: {
    port: 3000, // The port to run the dev server on.
    // tailwindConfig: '',  // Path to tailwind.config.js if used, e.g. './tailwind.config.js'
  },
  // component renderers which are enabled by default
  renderers: [
    '@astrojs/renderer-svelte',
    '@astrojs/renderer-vue',
    '@astrojs/renderer-react',
    '@astrojs/renderer-preact',
  ],
};
```

## Snowpack Config

Astro is powered internally by Snowpack. You can configure Snowpack directly by creating a `snowpack.config.mjs` file. See [snowpack.dev](https://www.snowpack.dev/reference/configuration) for full documentation on this file.
