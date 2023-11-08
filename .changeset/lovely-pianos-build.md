---
'astro': minor
---

Provides a new, experimental build cache for [Content Collections](https://docs.astro.build/en/guides/content-collections/) as part of the [Incremental Build RFC](https://github.com/withastro/roadmap/pull/763). This includes multiple refactors to Astro's build process to optimize how Content Collections are handled, which should provide significant performance improvements for users with many collections. 

Users building a `static` site can opt-in to preview the new build cache by adding the following flag to your Astro config:

```js
// astro.config.mjs
export default {
  experimental: {
    contentCollectionCache: true,
  },
};
```

When this experimental feature is enabled, the files generated from your content collections will be stored in the [`cacheDir`](https://docs.astro.build/en/reference/configuration-reference/#cachedir) (by default, `node_modules/.astro`) and reused between builds. Most CI environments automatically restore files in `node_modules/` by default.

In our internal testing on the real world [Astro Docs](https://github.com/withastro/docs) project, this feature reduces the bundling step of `astro build` from **133.20s** to **10.46s**, about 92% faster. The end-to-end `astro build` process used to take **4min 58s** and now takes just over `1min` for a total reduction of 80%.

If you run into any issues with this experimental feature, please let us know! 

You can always bypass the cache for a single build by passing the `--force` flag to `astro build`.

```
astro build --force
```
