---
'astro': minor
---

Adds support for experimental parallel prerendering

This experimental feature makes `astro build` render your static pages in parallel, using multiple CPU cores at once instead of one. On sites with many pages, this can significantly reduce build times, at the cost of higher memory usage.

To enable this feature, add the experimental flag in your Astro config:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    parallelPrerender: true,
  },
});
```

By default, Astro uses all available CPU cores but one. Each additional worker increases the memory used by your build. If your build runs out of memory, or does not get faster, set `workers` to a lower number:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  experimental: {
    parallelPrerender: {
      workers: 4,
    },
  },
});
```

Each worker renders as many pages at once as your [`build.concurrency`](https://docs.astro.build/en/reference/configuration-reference/#buildconcurrency) setting allows.

This feature has no effect when your adapter provides its own way of prerendering pages. Among official adapters, this only applies to `@astrojs/cloudflare`. Astro logs a warning during the build when the flag is ignored.

For more information on enabling and using this feature in your project, see the [experimental parallel prerendering docs](https://docs.astro.build/en/reference/experimental-flags/parallel-prerender/).
