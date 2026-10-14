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

#### Changes for integration authors

The resolved `config.image.service` can now be either shape and keeps the shape the user configured. When a project sets `build` and `runtime` services, `config.image.service.entrypoint` and `config.image.service.config` are `undefined`.

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

Using `updateConfig()` to define `image.service` replaces the existing service instead of merging with it when the two use different shapes. For example, setting a single service in a project that uses `build` and `runtime` services will replace them both.

