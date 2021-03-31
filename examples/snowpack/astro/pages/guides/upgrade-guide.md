---
layout: ../../layouts/content.astro
title: Snowpack Upgrade Guide
published: true
description: How to upgrade to Snowpack v3 from older versions of Snowpack.
---

Snowpack v3.0 was released on January 12th with several new features and some breaking changes. This guide is designed to help you upgrade a project from older versions of Snowpack v1 or v2.

## Upgrading from Snowpack v3 Release Candidate

Our v3.0 Release Candidate was meant to be a close-to-final release, but some major changes still got in between then and the v3.0 final release. Snowpack will warn when any outdated APIs are used, and guide you through the upgrade process.

In the future, Snowpack Release Candidates will be much closer to final API.

## Upgrading from Snowpack v2

Snowpack v3.0 was mainly designed around new features, and therefore didn't have many major breaking changes introduced. However, there are some changes to be aware of:

- **Config name changes:** There was some cleanup of legacy behavior and renaming of old configuration values. Snowpack will warn you of all known name changes when run Snowpack v3.0 for the first time, with instructions to help you upgrade.
- **package.json "homepage" no longer sets "baseUrl":** This was a behavior of Create React App that we'd originally tried to match. However, it became confusing to explain to users. In Snowpack v3.0, set "buildOptions.baseUrl" directly.
- **Improved support for relative paths in configuration:** All relative paths in configuration files are now relative to the configuration file itself. Previously, all relative config paths were resolved based on the current working directory of wherever you ran Snowpack, which meant that behavior of the config file changed depending on where you ran it. You can also now set the project `"root"`/`--root` directory, which is useful if you run Snowpack from a different directory than the project iself (ex: in monorepos).
- **More clear build file naming:** Snowpack v3.0 introduced some cleanup around build file names that you may see when you upgrade projects. The biggest change is to files like `.svelte` and `.vue`, which now have their JS & CSS built to `.svelte.js` and `.svelte.css` respectively. This change shouldn't be noticable to most, but it is good to know.
- **More clear handling of absolute import URLs:** In Snowpack, it's now possible to import something by its final URL using an absolute URL. `import "/dist/index.js"`, for example, will now import whatever file is built to `/dist/index.js`. Previously, this behavior was undefined. Relative URLs can still be used to import files relative to the source file itself.

## Upgrading from Snowpack v1

Snowpack v1 only supported installing npm packages as ESM, and had a more limited scope than Snowpack does today. If you are coming from Snowpack v1.0, you may be able to use our internal package installer library [esinstall](https://www.npmjs.com/package/esinstall) directly. `esinstall` is a JavaScript library that implements most of what Snowpack v1.0 gave you via the command-line.

`snowpack build` builds your site into web native JS, CSS, and HTML files. This "unbundled" deployment can be enough for small sites, but many developers prefer to optimize and bundle their final site for production performance.

Snowpack can run all sorts of optimizations on your final build to handle legacy browser support, code minification, code-splitting, tree-shaking, dead code elimination, preloading, bundling, and more.

Snowpack build optimizations come in two flavors: **built-in** (esbuild) & **plugin** (webpack, rollup, or whatever else you might like to run).

### Option 1: Built-in Optimizations

Snowpack recently released a built-in optimization pipeline powered by [esbuild](https://esbuild.github.io/). Using this built-in optimizer, you can now bundle, transpile, and minify your production builds 10x-100x faster than Webpack or Rollup. However, esbuild is still young and [not yet production-ready](https://esbuild.github.io/faq/#production-readiness). At the moment, we only recommended this for smaller projects.

```js
// snowpack.config.js
// Example: Using Snowpack's built-in bundling support
{
  "optimize": {
    "bundle": true,
    "minify": true,
    "target": 'es2018'
  }
}
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
