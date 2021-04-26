---
layout: ../../layouts/content.astro
title: How Snowpack Works
description: Snowpack serves your application unbundled during development. Each file is built only once and is cached until it changes.
---

### Summary

**Snowpack is a modern, lightweight build tool for faster web development.** Traditional JavaScript build tools like webpack and Parcel need to rebuild & rebundle entire chunks of your application every time you save a single file. This rebundling step introduces lag between hitting save on your changes and seeing them reflected in the browser.

Snowpack serves your application **unbundled during development.** Each file needs to be built only once and then is cached forever. When a file changes, Snowpack rebuilds that single file. There's no time wasted re-bundling every change, just instant updates in the browser (made even faster via [Hot-Module Replacement (HMR)](/concepts/hot-module-replacement)). You can read more about this approach in our [Snowpack 2.0 Release Post.](/posts/2020-05-26-snowpack-2-0-release/)

Snowpack's **unbundled development** still supports the same **bundled builds** that you're used to for production. When you go to build your application for production, you can plug in your favorite bundler via an official Snowpack plugin for Webpack or Rollup (coming soon). With Snowpack already handling your build, there's no complex bundler config required.

**Snowpack gets you the best of both worlds:** fast, unbundled development with optimized performance in your bundled production builds.

![webpack vs. snowpack diagram](/img/snowpack-unbundled-example-3.png)

### Unbundled Development

**Unbundled development** is the idea of shipping individual files to the browser during development. Files can still be built with your favorite tools (like Babel, TypeScript, Sass) and then loaded individually in the browser with dependencies thanks to ESM `import` and `export` syntax. Any time you change a file, Snowpack rebuilds only that file.

The alternative is **bundled development.** Almost every popular JavaScript build tool today focuses on bundled development. Running your entire application through a bundler introduces additional work and complexity to your dev workflow that is unnecessary now that ESM is widely supported. Every change -- on every save -- must be rebundled with the rest of your application before your changes can be reflected in your browser.

Unbundled development has several advantages over the traditional bundled development approach:

- Single-file builds are fast.
- Single-file builds are deterministic.
- Single-file builds are easier to debug.
- Project size doesn’t affect dev speed.
- Individual files cache better.

That last point is key: **Every file is built individually and cached indefinitely.** Your dev environment will never build a file more than once and your browser will never download a file twice (until it changes). This is the real power of unbundled development.

### Using NPM Dependencies

NPM packages are mainly published using a module syntax (Common.js, or CJS) that can't run on the web without some build processing. Even if you write your application using browser-native ESM `import` and `export` statements that would all run directly in the browser, trying to import any one npm package will force you back into bundled development.

**Snowpack takes a different approach:** Instead of bundling your entire application for this one requirement, Snowpack processes your dependencies separately. Here's how it works:

```
node_modules/react/**/*     -> http://localhost:3000/web_modules/react.js
node_modules/react-dom/**/* -> http://localhost:3000/web_modules/react-dom.js
```

1. Snowpack scans your website/application for all used npm packages.
2. Snowpack reads these installed dependencies from your `node_modules` directory.
3. Snowpack bundles all of your dependencies separately into single JavaScript files. For example: `react` and `react-dom` are converted to `react.js` and `react-dom.js`, respectively.
4. Each resulting file can be run directly in the browser, and imported via ESM `import` statements.
5. Because your dependencies rarely change, Snowpack rarely needs to rebuild them.

After Snowpack builds your dependencies, any package can be imported and run directly in the browser with zero additional bundling or tooling required. This ability to import npm packages natively in the browser (without a bundler) is the foundation that all unbundled development and the rest of Snowpack is built on top of.

```html
<!-- This runs directly in the browser with `snowpack dev` -->
<body>
  <script type="module">
    import React from 'react';
    console.log(React);
  </script>
</body>
```
