---
'astro': minor
---

Adds support for separate `build` and `runtime` image services

`image.service` now also accepts a `build` and a `runtime` service. The `build` service optimizes images on prerendered pages when you build your site, and is also used during development. The `runtime` service handles images on on-demand rendered pages and the image endpoint of your deployed site.

The following example uses Sharp to optimize images on prerendered pages, and an image CDN for on-demand rendered pages:

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

#### Changes for integration authors

`config.image.service` keeps the shape the user configured it with. When a project sets `build` and `runtime` services, `config.image.service.entrypoint` and `config.image.service.config` are `undefined`.

If your integration reads `image.service`, check for the `runtime` property to get the service you need:

```ts
'astro:config:done': ({ config }) => {
  const { service } = config.image;
  const runtimeService = 'runtime' in service ? service.runtime : service;

  if (runtimeService.entrypoint === 'astro/assets/services/sharp') {
    // ...
  }
},
```

Setting `image.service` with `updateConfig()` replaces the existing service instead of merging with it when the two use different shapes. For example, setting a single service in a project that uses `build` and `runtime` services replaces both.
