---
'astro': minor
---

Adds support for separate `build` and `runtime` image services

`image.service` now also accepts a `build` and a `runtime` service. The `build` service handles images on prerendered pages and generates them during the build. The `runtime` service handles on-demand pages and the image endpoint in production. For example, to optimize images on prerendered pages with Sharp, and use an image CDN for on-demand pages:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  image: {
    service: {
      build: { entrypoint: 'astro/assets/services/sharp' },
      runtime: { entrypoint: 'my-image-cdn-service' },
    },
  },
});
```

