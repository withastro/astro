---
'@astrojs/cloudflare': minor
---

Adds opt-in build-time image optimization for the `cloudflare-binding` image service. When enabled, the Cloudflare IMAGES binding transforms static images in the workerd prerender environment, and the optimized bytes are written directly to the output directory (falling back to Sharp if the binding fails).

To opt in, use the compound configuration form:

```js
export default defineConfig({
  adapter: cloudflare({
    imageService: { build: 'cloudflare-binding', runtime: 'cloudflare-binding' },
  }),
});
```

The string shorthand `imageService: 'cloudflare-binding'` preserves the current runtime-only behavior and is unaffected.
