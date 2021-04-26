---
layout: ../../layouts/content.astro
title: Optimize & Bundle for Production
published: true
description: How to optimize your Snowpack build for production, with or without a bundler.
---

`snowpack build` builds your site into web native JS, CSS, and HTML files. This "unbundled" deployment can be enough for small sites, but many developers prefer to optimize and bundle their final site for production performance.

Snowpack can run all sorts of optimizations on your final build to handle legacy browser support, code minification, code-splitting, tree-shaking, dead code elimination, preloading, bundling, and more.

Snowpack build optimizations come in two flavors: **built-in** (esbuild) & **plugin** (webpack, rollup, or whatever else you might like to run).

### Option 1: Built-in Optimizations

Snowpack recently released a built-in optimization pipeline powered by [esbuild](https://esbuild.github.io/). Using this built-in optimizer, you can now bundle, transpile, and minify your production builds 10x-100x faster than Webpack or Rollup. However, esbuild is still young and [not yet production-ready](https://esbuild.github.io/faq/#production-readiness). At the moment, we only recommended this for smaller projects.

```js
// snowpack.config.js
// Example: Using Snowpack's built-in bundling support
module.exports = {
  optimize: {
    bundle: true,
    minify: true,
    target: 'es2018',
  },
};
```

The full supported interface is:

```ts
export interface OptimizeOptions {
  entrypoints: 'auto' | string[] | ((options: { files: string[] }) => string[]);
  preload: boolean;
  bundle: boolean;
  splitting: boolean;
  treeshake: boolean;
  manifest: boolean;
  minify: boolean;
  target: 'es2020' | 'es2019' | 'es2018' | 'es2017';
}
```

### Option 2: Optimize Plugins

Snowpack supports popular bundlers via plugin:

- webpack (recommended!): [@snowpack/plugin-webpack](https://www.npmjs.com/package/@snowpack/plugin-webpack)
- Rollup: [snowpack-plugin-rollup-bundle](https://github.com/ParamagicDev/snowpack-plugin-rollup-bundle)

**For now, we recommend using @snowpack/plugin-webpack until our built-in optimize support is more mature.**

Check out our [Plugins Catalog](/plugins) to browse all available Snowpack plugins, and read the [Plugins Guide](/guides/plugins) if you're interested in creating your own.
