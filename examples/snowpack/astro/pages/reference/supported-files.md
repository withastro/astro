---
layout: layouts/content.astro
title: Supported Files
description: Snowpack ships with built-in support for many file types including json, js, ts, jsx, css, css modules, and images.
---

Snowpack ships with built-in support for the following file types, no configuration required:

- JavaScript (`.js`, `.mjs`)
- TypeScript (`.ts`, `.tsx`)
- JSON (`.json`)
- JSX (`.jsx`, `.tsx`)
- CSS (`.css`)
- CSS Modules (`.module.css`)
- Images & Assets (`.svg`, `.jpg`, `.png`, etc.)
- WASM (`.wasm`)

To customize build behavior and support new languages [check out our tooling guide](/guides/connecting-tools)

### JavaScript & ESM

Snowpack was designed to support JavaScript's native ES Module (ESM) syntax. ESM lets you define explicit imports & exports that browsers and build tools can better understand and optimize for. If you're familiar with the `import` and `export` keywords in JavaScript, then you already know ESM!

```js
// ESM Example - src/user.js
export function getUser() {
  /* ... */
}

// src/index.js
import { getUser } from './user.js';
```

All modern browsers support ESM, so Snowpack is able to ship this code directly to the browser during development. This is what makes Snowpack's **unbundled development** workflow possible.

Snowpack also lets you import non-JavaScript files directly in your application. Snowpack handles all this for you automatically so there's nothing to configure, using the following logic:

### TypeScript

Snowpack includes built-in support to build TypeScript files (`*.ts`) to JavaScript.

Note that this built-in support is build only. By default, Snowpack does not type-check your TypeScript code. To integrate type checking into your development/build workflow, add the [@snowpack/plugin-typescript](https://www.npmjs.com/package/@snowpack/plugin-typescript) plugin.

### JSX

Snowpack includes built-in support to build JSX files (`*.jsx` & `*.tsx`) to JavaScript.

If you are using Preact, Snowpack will detect this and switch to use the Preact-style JSX `h()` function. This is all done automatically for you. If you need to customize this behavior, consider adding the [@snowpack/plugin-babel](https://www.npmjs.com/package/@snowpack/plugin-babel) plugin for full compiler customization via Babel.

**Note: Snowpack's default build does not support JSX in `.js`/`.ts` files.** If you can't use the `.jsx`/`.tsx` file extension, you can use [@snowpack/plugin-babel](https://www.npmjs.com/package/@snowpack/plugin-babel) to build your JavaScript instead.

### JSON

```js
// Load the JSON object via the default export
import json from './data.json';
```

Snowpack supports importing JSON files directly into your application. Imported files return the full JSON object in the default import.

### CSS

```js
// Load and inject 'style.css' onto the page
import './style.css';
```

Snowpack supports importing CSS files directly into your application. Imported styles expose no exports, but importing one will automatically add those styles to the page. This works for all CSS files by default, and can support compile-to-CSS languages like Sass & Less via plugins.

If you prefer not to write CSS, Snowpack also supports all popular CSS-in-JS libraries (ex: styled-components) for styling.

### CSS Modules

```js
// 1. Converts './style.module.css' classnames to unique, scoped values.
// 2. Returns an object mapping the original classnames to their final, scoped value.
import styles from './style.module.css';

// This example uses JSX, but you can use CSS Modules with any framework.
return <div className={styles.error}>Your Error Message</div>;
```

Snowpack supports CSS Modules using the `[name].module.css` naming convention. Like any CSS file, importing one will automatically apply that CSS to the page. However, CSS Modules export a special default `styles` object that maps your original classnames to unique identifiers.

CSS Modules help you enforce component scoping & isolation on the frontend with unique-generated class names for your stylesheets.

### Other Assets

```jsx
import imgReference from './image.png'; // img === '/src/image.png'
import svgReference from './image.svg'; // svg === '/src/image.svg'
import txtReference from './words.txt'; // txt === '/src/words.txt'

// This example uses JSX, but you can use import references with any framework.
<img src={imgReference} />;
```

All other assets not explicitly mentioned above can be imported via ESM `import` and will return a URL reference to the final built asset. This can be useful for referencing non-JS assets by URL, like creating an image element with a `src` attribute pointing to that image.

### WASM

```js
// Loads and intializes the requested WASM file
const wasm = await WebAssembly.instantiateStreaming(fetch('/example.wasm'));
```

Snowpack supports loading WASM files directly into your application using the browser's [`WebAssembly`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly) API. Read our [WASM guide](/guides/wasm) to learn more.

### Import NPM Packages

```js
// Returns the React & React-DOM npm packages
import React from 'react';
import ReactDOM from 'react-dom';
```

Snowpack lets you import npm packages directly in the browser. Even if a package was published using a legacy format, Snowpack will up-convert the package to ESM before serving it to the browser.

When you start up your dev server or run a new build, you may see a message that Snowpack is "installing dependencies". This means that Snowpack is converting your dependencies to run in the browser. This needs to run only once, or until you next change your dependency tree by adding or removing dependencies.
