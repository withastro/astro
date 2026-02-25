---
'@astrojs/cloudflare': minor
---

Adds flexible `imageService` configuration for the Cloudflare adapter, with named presets and support for custom image services that need to run in Node at build time.

The `imageService` option now accepts named presets, a bare entrypoint, a shorthand object, or a full per-phase triple:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  adapter: cloudflare({
    // Named preset (recommended)
    imageService: 'compile',

    // Bare entrypoint — auto-detects whether Node is needed at build time
    imageService: './src/my-image-service.ts',

    // Shorthand with config
    imageService: { entrypoint: './src/my-image-service.ts', config: { quality: 80 } },

    // Full control over each phase
    imageService: { build: 'compile', dev: './src/my-image-service.ts', runtime: 'passthrough' },
  }),
});
```

**Available presets:**

- `cloudflare-binding` (default) — uses the Cloudflare Images binding (`IMAGES`) for transforms
- `cloudflare` — uses Cloudflare's CDN (`cdn-cgi/image`) for URL-based transforms
- `compile` — Sharp at build time and in dev, passthrough at runtime (pre-optimized assets served as-is)
- `passthrough` — no transforms anywhere

**Custom services** that can't run in workerd (e.g. anything using native Node modules) are automatically detected and compiled as a Node-side bundle for build-time transforms. The `compile` preset also picks up any image service set by another integration in its `config:setup` hook.

`imageService: 'sharp'` now throws with guidance to use `'compile'` instead. `imageService: 'custom'` is deprecated and maps to `'compile'` with a warning.
