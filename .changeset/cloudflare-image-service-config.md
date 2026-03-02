---
'@astrojs/cloudflare': minor
---

Adds flexible `imageService` configuration for the Cloudflare adapter, with named presets, a Vite dev middleware that uses `jiti` to dynamically import custom image services in Node, and support for per-phase service configuration.

The `imageService` option now accepts named presets, a bare entrypoint, a shorthand object, or a full per-phase triple:

```js
// Named preset (recommended)
imageService: 'compile'

// Bare entrypoint — unknown entrypoints default to transformsAtBuild: true
imageService: './src/my-image-service.ts'

// Shorthand with config
imageService: { entrypoint: './src/my-image-service.ts', config: { quality: 80 } }

// Full control over each phase
imageService: {
  build: './src/my-build-service.ts',
  dev: './src/my-dev-service.ts',
  runtime: './src/my-runtime-service.ts',
  transformAtBuild: false,
}
```

**Available presets:**

- `cloudflare-binding` (default) — uses the Cloudflare Images binding (`IMAGES`) for transforms
- `cloudflare` — uses Cloudflare's CDN (`cdn-cgi/image`) for URL-based transforms
- `compile` — Sharp at build time and in dev, passthrough at runtime (pre-optimized assets served as-is)
- `passthrough` — no transforms anywhere
- `custom` (deprecated) — workerd stub for build, Sharp in dev, user's `config.image.service` at runtime

`imageService: 'custom'` is deprecated. It uses the workerd stub for build, Sharp for dev, and preserves the user's existing `config.image.service` at runtime.
