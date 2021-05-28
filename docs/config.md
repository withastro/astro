# ⚙️ Configuration

To configure Astro, add an `astro.config.mjs` file in the root of your project. All settings are optional. Here are the defaults:

```js
export default {
  /** Where to resolve all URLs relative to. Useful if you have a monorepo project. */
  projectRoot: '.',
  /** Path to Astro components, pages, and data */
  astroRoot: './src',
  /** When running `astro build`, path to final static output */
  dist: './dist',
  /** A folder of static files Astro will copy to the root. Useful for favicons, images, and other files that don’t need processing. */
  public: './public',
  /** Extension-specific handlings */
  extensions: {
    /** Set this to "preact" or "react" to determine what *.jsx files should load */
    '.jsx': 'react',
  },
  /** Options specific to `astro build` */
  buildOptions: {
    /** Your public domain, e.g.: https://my-site.dev/. Used to generate sitemaps and canonical URLs. */
    site: '',
    /** Generate sitemap (set to "false" to disable) */
    sitemap: true,
  },
  /** Options for the development server run with `astro dev`. */
  devOptions: {
    /** The port to run the dev server on. */
    port: 3000,
    /** Path to tailwind.config.js if used, e.g. './tailwind.config.js' */
    tailwindConfig: undefined,
  },
  /** default array of rendering packages inserted into runtime */
  renderers: ['@astrojs/renderer-preact', '@astrojs/renderer-react', '@astrojs/renderer-svelte', '@astrojs/renderer-vue'],
};
```
