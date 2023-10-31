---
'astro': minor
---

Provides a new, experimental build cache for [Content Collections](https://docs.astro.build/en/guides/content-collections/). This includes multiple refactors to Astro's build process to optimize how Content Collections are handled, which should provide significant performance improvements for users with many collections.

You can enable the build cache by adding the following flag to your Astro config:

```js
// astro.config.mjs
export default {
  experimental: {
    contentCollectionCache: true,
  },
};
```

When this experimental feature is enabled, you can bypass the local build cache by passing the `--force` flag to `astro build`.

```
astro build --force
```
