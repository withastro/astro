---
'astro': minor
---

Adds a new `build.concurreny` configuration option to specify the number of pages to build in parallel

**In most cases, you should not change the default value of `1`.**

Use this option only when other attempts to reduce the overall rendering time (e.g. batch or cache long running tasks like fetch calls or data access) are not possible or are insufficient.

Use this option only if the refactors are not possible. If the number is set too high, the page rendering may slow down due to insufficient memory resources and because JS is single-threaded.

> [!WARNING]
> This feature is stable and is not considered experimental. However, this feature is only intended to address difficult performance issues, and breaking changes may occur in a [minor release](https://docs.astro.build/en/upgrade-astro/#semantic-versioning) to keep this option as performant as possible.

```js
// astro.config.mjs
import { defineConfig } from 'astro';

export default defineConfig({
  build: {
    concurrency: 2,
  },
});
```
