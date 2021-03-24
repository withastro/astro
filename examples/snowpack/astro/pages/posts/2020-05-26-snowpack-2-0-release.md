---
layout: layouts/post.astro
bannerVideo: '/img/extra-space-4.mp4'
permalink: '/posts/2020-05-26-snowpack-2-0-release/'
title: Snowpack v2.0
description: 'Build web applications with less tooling and faster iteration.'
tagline: v2.0.0 release post
date: 2020-05-26
---

After 40+ beta versions & release candidates we are very excited to introduce **Snowpack 2.0: A build system for the modern web.**

- Starts up in <50ms and stays fast in large projects.
- Bundle-free development with bundled production builds.
- Built-in support for TypeScript, JSX, CSS Modules and more.
- Works with React, Preact, Vue, Svelte, and all your favorite libraries.
- [Create Snowpack App (CSA)](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/cli) starter templates.

<br/>

```bash
# install with npm
npm install --save-dev snowpack

# install with yarn
yarn add --dev snowpack
```

## The Road to Snowpack 2.0

Snowpack 1.0 was designed for a simple mission: install npm packages to run directly in the browser. The theory was that JavaScript packages are the only thing still **_requiring_** the use of a bundler during development. Remove that requirement, remove the bundler, and speed up web development for everyone.

Guess what? It worked! Thousands of developers started using Snowpack to install their dependencies and build websites with less tooling. A whole new type of faster, lighter-weight dev environment suddenly became possible.

**Snowpack 2.0 is a build system designed for this new era of web development.** Snowpack removes the bundler from your dev environment, leveraging native [ES Module (ESM)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) support to serve built files directly to the browser. This isn't just a faster tool, it's a new approach to web build systems.

## The Rise of O(1) Build Systems

![webpack vs. snowpack diagram](/img/snowpack-unbundled-example-3.png)

**Bundling is a process of `O(n)` complexity.** When you change a file, you can't just rebuild that one file. You often need to rebuild and rebundle an entire chunk of your application across multiple related files to properly accept the new changes.

**Snowpack is an O(1) build system.** The term was first coined by [Ives van Hoorne](https://www.youtube.com/watch?v=Yu9zcJJ4Uz0) and it perfectly encapsulates our vision for the future of web development. Every file built with Snowpack can be expressed as a function: `build(file) => result`. When a file is changed during development, only that file is rebuilt.

This has several advantages over the traditional bundled dev approach:

- O(1) builds are faster.
- O(1) builds are predictable.
- O(1) builds are easy to reason about & configure.
- Project size doesn't affect build time during development.
- Individual files cache better.

That last point is key: every built file is cached individually and reused indefinitely. **If you never change a file, you will never need to re-build it again.**

## `dev` A Faster Dev Environment

![dev command output example](/img/snowpack-dev-startup-2.png)

Run `snowpack dev` to start your new web dev environment and the first thing you'll notice is **how flippin' fast O(1) build tooling is.** Snowpack starts up in less than 50ms. That's no typo: 50 milliseconds or less.

With no bundling work needed to start, your server spins up immediately. On your very first page load, Snowpack builds your first requested files and then caches them for future use. Even if your project contains a million different files, Snowpack builds only those needed to load the current page. This is how Snowpack stays fast.

`snowpack dev` includes a development server and a bunch of familiar features right out of the box:

- TypeScript Support
- JSX Support
- Hot Module Replacement (HMR)
- Importing CSS & CSS Modules
- Importing Images & Other Assets
- Custom Routing
- Proxying Requests

## Customizing Your Build

[Build Scripts](/concepts/build-pipeline) let you connect your favorite build tools. With Snowpack, you express every build as a linear `input -> build -> output` workflow. This allow Snowpack to pipe your files into and out of any existing UNIX-y CLI tools without the need for a special plugin ecosystem.

```js
// snowpack.config.json
{
  "scripts": {
    // Pipe every "*.css" file through the PostCSS CLI
    // stdin (source file) > postcss > stdout (build output)
    "build:css": "postcss",
  }
}
```

If you've ever used your `package.json` "scripts" config, this format should feel familiar. We love the simplicity of using your CLIs directly without an unnecessary plugin system. We hope this pattern offers a similar intuitive design.

If you want more control over your build (or want to write your own build tool) Snowpack also supports [third-party JavaScript plugins](/plugins). [Check out our docs](/concepts/build-pipeline) to learn more about customizing your build.

## `build` Bundling for Production

![build output example](/img/snowpack-build-example.png)

To be clear, Snowpack isn't against bundling for production. In fact, we recommend it. File minification, compression, dead-code elimination and network optimizations can all make a bundled site run faster for your users, which is the ultimate goal of any build tool.

Snowpack treats bundling as a final, production-only build optimization. By bundling as the final step, you avoid mixing build logic and bundle logic in the same huge configuration file. Instead, your bundler gets already-built files and can focus solely on what it does best: bundling.

Snowpack maintains official plugins for both Webpack & Parcel. Connect your favorite, and then run `snowpack build` to build your site for production.

```js
// snowpack.config.json
{
  // Optimize your production builds with Webpack
  "plugins": [["@snowpack/plugin-webpack", {/* ... */}]]
}
```

If you don't want to use a bundler, that's okay too. Snowpack's default build will give you an unbundled site that also runs just fine. This is what the Snowpack project has been all about from the start: **Use a bundler because you want to, and not because you need to.**

## Try Snowpack Today

We are so excited to share this all with you today. Download Snowpack to experience the future of web development.

```
npm i snowpack@latest --save-dev
```

If you already have an existing Snowpack application, Snowpack 2.0 will walk you through updating any outdated configuration. Snowpack's original package installer still works as expected, and with the new `dev` & `build` commands Snowpack even manages your web packages for you.

**[Check out our docs site to learn more.](https://www.snowpack.dev/)**

#### Create Snowpack App

The easiest way to get started with Snowpack is with [Create Snowpack App (CSA)](https://github.com/snowpackjs/snowpack). CSA automatically initializes a starter application for you with a pre-configured, Snowpack-powered dev environment.

```bash
npx create-snowpack-app new-dir --template [SELECT FROM BELOW] [--use-yarn]
```

- [@snowpack/app-template-blank](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-blank)
- [@snowpack/app-template-react](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-react)
- [@snowpack/app-template-react-typescript](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-react-typescript)
- [@snowpack/app-template-preact](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-preact)
- [@snowpack/app-template-svelte](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-svelte)
- [@snowpack/app-template-vue](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-vue)
- [@snowpack/app-template-lit-element](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-lit-element)
- [@snowpack/app-template-11ty](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app/app-template-11ty)
- **[See all community templates](https://github.com/snowpackjs/snowpack/tree/main/create-snowpack-app)**

🐹 Happy hacking!

---

_Thank you to all of our [80+ contributors](https://github.com/snowpackjs/snowpack/graphs/contributors) for making this release possible._
_Thanks to [Melissa McEwen](https://twitter.com/melissamcewen) & [@TheoOnTwitch](https://twitter.com/TheoOnTwitch) for helping to edit this post._
