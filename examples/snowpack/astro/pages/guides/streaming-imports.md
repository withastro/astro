---
layout: ../../layouts/content.astro
title: Streaming Imports
published: true
stream: Fetch your npm dependencies on-demand from a remote ESM CDN.
---

Snowpack v3.0 introduces a new feature called **Streaming Imports** that fetches imported packages on-demand during development and building. By managing your frontend dependencies with Snowpack, you can leave `npm` for your tooling-only packages or even drop your dependency on `npm`/`yarn`/`pnpm` all togther.

## Enable Streaming Imports

```js
// snowpack.config.js
"packageOptions": {
  "source": "remote"
}
```

Set `packageOptions.source` to "remote" to enable streaming imports. This tells Snowpack to fetch your imports from our remote CDN instead of bundling them locally. Read our [full documentation on `packageOptions`](/reference/configuration#packageoptions.source%3Dremote) to learn more about customizing this behavior.

## How Streaming Imports Work

When you enable streaming imports, `snowpack` will start fetching all imports from `https://pkg.snowpack.dev`. For example, `import "preact"` in your project will become something like `import "https://pkg.snowpack.dev/preact"` in the browser. This tells Snowpack (or the browser) to import your package by URL, and only fetch the package ESM when needed. Snowpack is able to cache the response for future, offline use.

`pkg.snowpack.dev` is our ESM Package CDN, powered by [Skypack](https://www.skypack.dev/). Every npm package is hosted as ESM, and any legacy non-ESM packages are upconverted to ESM on the CDN itself.

## Benefits of Streaming Imports

Streaming dependencies have several benefits over the traditional "npm install + local bundling" approach:

- **Speed:** Skip the install + build steps for dependencies, and load your dependencies as pre-build ESM code directly from an ESM CDN like [Skypack](https://www.skypack.dev/). Dependencies are cached locally for offline reuse.
- **Safety:** ESM packages are pre-built and never given access to [run code on your machine](https://www.usenix.org/system/files/sec19-zimmermann.pdf). Packages only run in the browser sandbox.
- **Simplicity:** ESM packages are managed by Snowpack, so frontend projects that don't need Node.js (Rails, PHP, etc.) can drop the `npm` CLI entirely if they choose.
- **No Impact on Final Build:** Streaming imports are still transpiled and bundled with the rest of your final build, and tree-shaken to your exact imports. The end result is a final build that's nearly identical to what it would have been otherwise.

## Snowpack-Managed Dependencies

By default, Snowpack fetches the latest version of every package available. Breaking changes are possible over time without a way to manage your dependencies by version.

Snowpack uses a `snowpack.deps.json` in your project to manage your dependency versions. If you're familiar with `npm install`, your `snowpack.deps.json` file is like a combined `package.json` and `package-lock.json`.

Two commands are available to work with this file: `snowpack add` and `snowpack rm`.

Running `snowpack add [package-name]` for the first time will create a new `snowpack.deps.json` file in your project to store information about your new dependency, like desired SemVer version range and lockfile information.

## Using Streaming Imports with TypeScript

```js
// snowpack.config.js /w TypeScript Support
"packageOptions": {
  "source": "remote",
  "types": true,
}
```

Setting `types=true` tells Snowpack to install TypeScript types in your project. Snowpack will install those types into a local `.snowpack/types` directory in your project, which you can then point to in your project `tsconfig.json` to get automatic types for your npm packages:

```js
// Example: tsconfig.json /w Snowpack streaming imports
"baseUrl": "./",
"paths": {"*": [".snowpack/types/*"]},
```

When you start your project (with either `snowpack dev` or `snowpack build`) Snowpack will sync this `.snowpack/types` directory and download any new types that you might need. You can also trigger a sync anytime manually via `snowpack prepare`.

## Using Streaming Imports with Non-JS Packages (Svelte, Vue, etc.)

Skypack (the CDN that powers `pkg.snowpack.dev`) will always prefer a package JavaScript entrypoint over any source `.svelte` and `.vue` files. This works for most packages (including most Svelte & Vue packages) but may cause trouble in some projects. In a future release, we'll add better support to build these kinds of packages locally.

## What do I do if a package isn't supported / working?

Skypack (the CDN that powers `pkg.snowpack.dev`) is always improving, and its goal is to support all packages. If you find a package that doesn't work, report it to [Skypack's issue tracker](https://github.com/snowpackjs/skypack-cdn/issues) on GitHub. Many of Snowpack's core contributors also work on Skypack, and will be happy to take a look at the broken package.

In a future release, we'll add better support to replace broken packages locally.
