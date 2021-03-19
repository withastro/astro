---
layout: layouts/post.hmx
title: 'Snowpack v3.0 Release Candidate'
tagline: New features to change the way you build for the web.
description: 'New features to change the way you build for the web. Snowpack v3.0 will release on January 6th, 2021 (the one-year anniversary of its original launch post). This is our biggest release yet with some serious new features, including a new way to load npm packages on-demand that lets you skip the `npm install` step entirely.'
date: 2020-12-03
---

**tl;dr:** Snowpack v3.0 will release on January 6th, 2021 (the one-year anniversary of its original launch post). This is our biggest release yet with some serious new features, including **a new way to load npm imports on-demand** and skip the frontend `npm install` step entirely.

**Update:** Release was delayed for a week for some finishing touches. New release date is January 13th! [More info on Discord](https://discord.com/channels/712696926406967308/783454799051489301/796785330932940800).

Best of all: it's all available to try today!

## What's New?

Snowpack v3 will focus on the polish & official release of four features already available today in the current version of Snowpack (v2.18.0) under the `experiments` flag:

- `experiments.source` - Streaming npm imports, no install step required.
- `experiments.optimize` - Built-in bundling, preloading, and asset minifying.
- `experiments.routes` - Advanced config for HTML fallbacks and API proxies.
- `import 'snowpack'` - A brand new JavaScript API for Snowpack integrations.

<video preload="auto" autoplay loop muted playsinline>
    <source src="/img/snowpackskypack.webm" type="video/webm">
    <source src="/img/snowpackskypack.mp4" type="video/mp4">
</video>

## New: Streaming Package Imports

Snowpack has always pushed the limits of frontend development, and this release is no different. Snowpack v3.0 introduces an exciting new feature to speed up & simplify your development workflow.

Typically, JavaScript dependencies are installed and managed locally by a package manager CLI like `npm`, `yarn` or `pnpm`. Packages are often bloated with unrelated files and almost never run directly in the browser. Additional steps are required to process, build and bundle these installed packages so that they can actually run in browser.

**What if we could simplify this? What if Snowpack could skip the "npm install" step entirely and just fetch the relevant, pre-built package code on-demand via ESM?**

```js
// you do this:
import * as React from 'react';

// but get behavior like this:
import * as React from 'https://cdn.skypack.dev/react@17.0.1';
```

That URL in the example above points to [Skypack](https://www.skypack.dev/), a popular JavaScript CDN that we built to serve every npm package as ESM. Importing dependencies by URL like this is well supported in Snowpack, Deno, and all major browsers. But writing these URLs directly into your source code isn't ideal and makes development impossible without a network connection.

**Snowpack v3.0 brings together the best of both worlds:** Get the simplicity of `import 'react'` in your own source code and let Snowpack fetch these dependencies behind the scenes, pre-built and ready to run in the browser. Snowpack caches everything for you automatically, so you can continue to work offline without relying on Skypack besides the first package fetch.

This has several benefits over the traditional "npm install" approach:

- **Speed:** Skip the install + build steps for dependencies, and load your dependencies as pre-build ESM code.
- **Safety:** ESM packages are pre-built into JavaScript for you and never given access to [run code on your machine](https://www.usenix.org/system/files/sec19-zimmermann.pdf). Third-party code only ever run in the browser sandbox.
- **Simplicity:** ESM packages are managed by Snowpack, so frontend projects that don't need Node.js (Rails, PHP, etc.) can drop the npm CLI entirely if they choose.
- **Same Final Build:** When you build your site for production, package code is transpiled with the rest of your site and tree-shaken to your exact imports, resulting in a final build that's nearly identical.

If this all sounds too wild for you, don't worry. This is **100% opt-in** behavior for those who want it. By default, Snowpack will continue to pull your npm package dependencies out of your project `node_modules` directory like it always has.

Check out our guide on [Streaming Package Imports](/guides/streaming-imports) to learn more about how to enable this new behavior in your project today. In a future release, we hope to open this up to custom ESM package sources and other CDNs as well.

![js api](/img/post-snowpackv3-esbuild.png)

## Built-in Optimizations, Powered by esbuild

[esbuild](https://esbuild.github.io/) is a marvel: it performs 100× faster than most other popular bundlers and over 300× faster than Parcel (by esbuild's own benchmarks). esbuild is written in Go, a compiled language that can parallelize heavy bundling workloads where other popular bundlers -- written in JavaScript -- cannot.

Snowpack already uses esbuild internally as our default single-file builder for JavaScript, TypeScript and JSX files. Snowpack v3.0 takes this integration one step further, with a new built-in build optimization pipeline. Bundle, minify, and transpile your site for production in 1/100th of the time of other bundlers.

Snowpack is able to adopt esbuild today thanks to an early bet that we made on the future of bundling: **bundling is a post-build optimization, and not the core foundation that everything is built on top of.** Thanks to this early design decision, esbuild can be plugged in and swapped out of your Snowpack build as easily as any other bundler.

esbuild is still a young project, but it's future looks promising. In the meantime, we will also continue to invest in the existing Webpack & Rollup bundler plugins for a long time to come.

To get started, check out the `experiments.optimize` option in our newest [Optimizing Your Snowpack Build](/guides/optimize-and-bundle) guide.

![js api](/img/post-snowpackv3-routes.png)

## Routing

Snowpack's new `experiments.routes` configuration lets you define routes that align your dev environment with production. This unlocks some interesting new use-cases, including:

- **API Proxies** - Route all `/api/*` URLs to another URL or localhost port.
- **SPA Fallbacks** - Serve an app shell `index.html` to all requested routes.
- **Faster Site Loads** - Speed up your site and serve different HTML shell files for each route.
- **Island Architecture** - Serve HTML that renders individual components on the page, in parallel. (Made popular by [Jason Miller](https://twitter.com/_developit) in [this blog post](https://jasonformat.com/islands-architecture/)).
- **Mimic Vercel/Netlify** - Re-create your Vercel or Netlify routes in development. Or, create a Snowpack plugin to automatically generate these routes from your `vercel.json` or `_redirects` file at startup.

While API proxying and SPA fallbacks have already been supported in Snowpack for a while now, this brings them all together into a single, expressive new API.

![js api](/img/post-snowpackv3-jsapi.png)

## A New JavaScript API

Snowpack's new JavaScript API grants you more advanced control over Snowpack's dev server and build pipeline, helping you build more powerful integrations on top of Snowpack to unlock new kinds of dev tooling and server-side rendering (SSR) solutions.

The Svelte team recently made news with [SvelteKit](https://svelte.dev/blog/whats-the-deal-with-sveltekit): An official, zero-effort SSR app framework for Svelte apps. SvelteKit is powered internally by Snowpack, using our brand-new JavaScript API to manage your build pipeline and build files on-demand. Snowpack speeds up development and helps to cut SvelteKit's startup time to near-zero.

Check out our new [JavaScript API reference](/reference/javascript-interface) to start building your own custom integrations on top of Snowpack. Or, read through our new guide on [Server-Side Rendering](/guides/server-side-render) to get started with a custom SSR integration for production.

## Installation

You can install the Snowpack v3.0 release candidate today by running:

```
npm install snowpack@next
```

Since all v3.0 features already exist in Snowpack today, our existing documentation site applies to both v2 & v3. At this point only very old, undocumented, legacy behavior has been removed from the `next` v3.0 branch.

Features under the `experiments` flag may continue to change as we get closer to the official release date. By the end of the year, you can expect that these features will move out from behind the `experiments` flag and into top-level config objects in the `next` v3.0 branch.

Learn more at [snowpack.dev](https://www.snowpack.dev). Happy hacking!
