---
layout: ../../layouts/content.astro
title: 'WASM'
tags: communityGuide
published: true
img: '/img/logos/wasm.svg'
imgBackground: '#f2f2f8'
description: How to use WASM in your Snowpack project.
---

[WASM (short for WebAssembly)](https://webassembly.org/) is a portable compilation target for programming languages, enabling deployment on the web for client and server applications.

**To use WASM with Snowpack:** Use the browser's native [`WebAssembly`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly) & [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) APIs to load a WASM file into your application:

```js
// Example: Load WASM in your project
const wasm = await WebAssembly.instantiateStreaming(
  fetch('/example.wasm'),
  /* { ... } */
);
```

In the future, we may add `import "/example.wasm"` ESM import support to automate this support for you. However, today WASM import support differs from bundler-to-bundler.

In any case, WASM import support would just be a shortcut or wrapper around the code snippet above. You can recreate this helper today in your own project:

```js
// Example: WASM Loader (move this into some utilility/helper file for reuse)
export function loadWasm(url, importObject = {module: {}, env: {abort() {}}}) => {
  const result = await WebAssembly.instantiateStreaming(fetch(url), importObject);
  return result.instance; // or, return result;
}

const wasm = await loadWasm('/example.wasm');
```
