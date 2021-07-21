---
layout: ~/layouts/Main.astro
title: Data Fetching
---

Astro components and pages can fetch remote data to help generate your pages. Astro provides two different tools to pages to help you do this: **fetch()** and **top-level await.**

## `fetch()`

Astro pages have access to the global `fetch()` function in their setup script. `fetch()` is a native JavaScript API ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)) that lets you make HTTP requests for things like APIs and resources.

Even though Astro component scripts run inside of Node.js (and not in the browser) Astro provides this native API so that you can fetch data at page build time.

```astro
---
// Movies.astro
const response = await fetch('https://example.com/movies.json');
const data = await response.json();
// Remember: Astro component scripts log to the CLI
console.log(data);
---
<!-- Output the result to the page -->
<div>{JSON.stringify(data)}</div>
```

## Top-level await

`await` is another native JavaScript feature that lets you await the response of some asynchronous promise ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)). Astro supports `await` in the top-level of your component script.

**Important:** These are not yet available inside of non-page Astro components. Instead, do all of your data loading inside of your pages, and then pass them to your components as props.

## Using `fetch()` outside of Astro Components

If you want to use `fetch()` in a non-astro component, use the [`node-fetch`](https://github.com/node-fetch/node-fetch) library:

```tsx
// Movies.tsx
import fetch from 'node-fetch';
import type { FunctionalComponent } from 'preact';
import { h } from 'preact';

const data = fetch('https://example.com/movies.json').then((response) =>
  response.json()
);

// Components that are build-time rendered also log to the CLI.
// If you loaded this component with a directive, it would log to the browser console.
console.log(data);

const Movies: FunctionalComponent = () => {
  // Output the result to the page
  return <div>{JSON.stringify(data)}</div>;
};

export default Movies;
```

If you load a component using `node-fetch` [interactively](/core-concepts/component-hydration), with `client:load`, `client:visible`, etc., you'll need to either not use `node-fetch` or switch to an [isomorphic](https://en.wikipedia.org/wiki/Isomorphic_JavaScript) library that will run both at build time and on the client, as the [`node-fetch` README.md](https://github.com/node-fetch/node-fetch#motivation) recommends:

> Instead of implementing XMLHttpRequest in Node.js to run browser-specific [Fetch polyfill](https://github.com/github/fetch), why not go from native http to fetch API directly? Hence, node-fetch, minimal code for a window.fetch compatible API on Node.js runtime.
>
> See Jason Miller's [isomorphic-unfetch](https://www.npmjs.com/package/isomorphic-unfetch) or Leonardo Quixada's [cross-fetch](https://github.com/lquixada/cross-fetch) for isomorphic usage (exports node-fetch for server-side, whatwg-fetch for client-side).

> Quoted from https://github.com/node-fetch/node-fetch#motivation
