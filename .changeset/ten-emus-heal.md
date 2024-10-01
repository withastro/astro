---
'astro': minor
---

Adds the `build.concurreny` to specify the number of pages to build in parallel. In most cases, you should stick with the default value of `1`,
and batch or cache long running tasks like fetch calls or data access to improve the overall rendering time.

Use this option only if the refactors are not possible. If the number is set too high, the page rendering
may slow down due to insufficient memory resources and because JS is single-threaded.

In the future, Astro may reuse this option to render pages concurrently with multiple threads.

```js
// astro.config.mjs
import { defineConfig } from 'astro';

export default defineConfig({
  build: {
    concurrency: 2,
  },
});
```
