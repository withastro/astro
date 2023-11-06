---
'astro': minor
---

Prefetching is now supported in core

You can enable prefetching for your site with the `prefetch: true` config. It is enabled by default when using [View Transitions](https://docs.astro.build/en/guides/view-transitions/) and can also be used to configure the `prefetch` behaviour used by View Transitions.

You can enable prefetching by setting `prefetch:true` in your Astro config:

```js 
// astro.config.js
import { defineConfig } from 'astro/config';

export default defineConfig({
  prefetch: true
})
```

This replaces the `@astrojs/prefetch` integration, which is now deprecated and will eventually be removed. 
Visit the [Prefetch guide](https://docs.astro.build/en/guides/prefetch/) for more information.
