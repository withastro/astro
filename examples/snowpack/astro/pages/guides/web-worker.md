---
layout: ../../layouts/content.astro
title: 'Web Workers'
tags: communityGuide
published: true
description: How to use Web Workers in your Snowpack project.
---

[Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) are a simple means for web content to run scripts in background threads.

**To use Web Workers with Snowpack:** Use the browser's native [Web Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#Web_Workers_API) directly:

```js
// Example: Load a Web Worker in your project
const myWorker = new Worker(new URL('./worker.js', import.meta.url));
```

Passing a `URL` to the Worker constructor (instead of a string literal) is recommended, but not required. Using a string literal (ex: `new Worker('./worker.js')`) may prevent some optimizations when you build your site for production.

Also note that the URL passed to the `Worker` must match the final URL which may differ from the path on disk. For example, `./worker.js` would still be used even if the original file on disk was `worker.ts`. `mount` destinations should also be used here, if needed.

### ESM Web Worker Support

**ESM syntax (`import`/`export`) in Web Workers is still not supported in all modern browsers.** Snowpack v3.0.0 and the Snowpack Webpack v5 plugin will both support automatic bundling once released. Until then, you'll need to write self-contained, single-file Web Workers (no ESM `import`/`export` statements) or pre-bundle your web workers yourself.

```js
const worker = new Worker(new URL('./esm-worker.js', import.meta.url), {
  name: 'my-worker',
  type: 'module',
});
```

<!--
TO REPLACE THE PREVIOUS PARAGRAPH ON v3.0.0 LAUNCH DAY:

Modern browsers have begun to support ESM syntax (`import`/`export`) inside of Web Workers. However, some notable exceptions still exist. To use ESM syntax inside of a web worker, consult [caniuse.com](https://caniuse.com/mdn-api_worker_worker_ecmascript_modules) and choose a supported browser for your local development. When you build for production, choose a bundler that will bundle your Web Worker to remove ESM import/export syntax. Currently, Snowpack's builtin bundler and @snowpack/plugin-webpack both support automatic Web Worker bundling to remove ESM syntax from web workers.


```js
const worker = new Worker(
  new URL('./esm-worker.js', import.meta.url),
  {
    name: 'my-worker',
    type: import.meta.env.MODE === 'development' ? "module" : "classic"
  }
);
```

-->
