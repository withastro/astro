---
'@astrojs/cloudflare': major
---

Changes the default `imageService` to `{ build: 'compile', runtime: 'cloudflare-binding' }`

The new default optimizes images for prerendered pages at build time and emits them as static assets, and keeps the Cloudflare Images binding for on-demand pages.

If you relied on the previous default or wish to avoid build time image transformations, set it explicitly:

```js
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: cloudflare({
    imageService: 'cloudflare-binding',
  }),
});
```

Along with the new default, a custom `image.service` is now used for build-time transforms instead of being discarded. Note that if your custom service imports `sharp`, it is now bundled into the Worker.
