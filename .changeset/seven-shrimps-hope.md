---
'@astrojs/image': minor
---

Adds caching support for transformed images :tada:

Local images will be cached for 1 year and invalidated when the original image file is changed.

Remote images will be cached based on the `fetch()` response's cache headers, similar to how a CDN would manage the cache.

**cacheDir**

By default, transformed images will be cached to `./node_modules/.astro/image`. This can be configured in the integration's config options.

```
export default defineConfig({
	integrations: [image({
    // may be useful if your hosting provider allows caching between CI builds
    cacheDir: "./.cache/image"
  })]
});
```

Caching can also be disabled by using `cacheDir: false`.
