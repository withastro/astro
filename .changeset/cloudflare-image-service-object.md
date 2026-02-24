---
"@astrojs/cloudflare": minor
---

Adds support for configuring the image service as an object with separate `build` and `runtime` options

It is now possible to set both a build-time and runtime service independently. Currently, `'compile'` is the only available build time option. The supported runtime options are `'passthrough'` (default) and `'cloudflare-binding'`:

```js title="astro.config.mjs" ins={6}
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    imageService: { build: 'compile', runtime: 'cloudflare-binding' }
  }),
});
```

See the [Cloudflare adapter `imageService` docs](https://v6.docs.astro.build/en/guides/integrations-guide/cloudflare/#imageservice) for more information about configuring your image service.
