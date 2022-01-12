---
layout: ~/layouts/MainLayout.astro
title: Data Fetching
description: Learn how to fetch remote data with Astro using the fetch API.
---

Astro components and pages can fetch remote data to help generate your pages. Astro provides two different tools to pages to help you do this: **fetch()** and **top-level await.**

## `fetch()`

Astro pages have access to the global `fetch()` function in their setup script. `fetch()` is a native JavaScript API ([MDN<span class="sr-only">- fetch</span>](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)) that lets you make HTTP requests for things like APIs and resources.

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

`await` is another native JavaScript feature that lets you await the response of some asynchronous promise ([MDN<span class="sr-only">- await</span>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)). Astro supports `await` in the top-level of your component script.

**Important:** These are not yet available inside of non-page Astro components. Instead, do all of your data loading inside of your pages, and then pass them to your components as props.

## Using `fetch()` outside of Astro Components

If you want to use `fetch()` in a non-astro component, it is also globally available:

```tsx
// Movies.tsx
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
