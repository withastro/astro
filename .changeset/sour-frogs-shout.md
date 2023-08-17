---
'astro': patch
---

Added support for optimizing remote images from authorized sources when using `astro:assets`. This comes with two new parameters to specify which domains (`image.domains`) and host patterns (`image.remotePatterns`) are authorized for remote images.

For example, the following configuration will only allow remote images from `astro.build` to be optimized:

```ts
// astro.config.mjs
export default defineConfig({
  image: {
    domains: ["astro.build"],
  }
});
```

The following configuration will only allow remote images from HTTPS hosts:

```ts
// astro.config.mjs
export default defineConfig({
  image: {
    remotePatterns: [{ protocol: "https" }],
  }
});
```
