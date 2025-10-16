---
'astro': patch
---

#### :warning: Breaking change for live content collections only

Removes support for the `maxAge` property in `cacheHint` objects returned by live loaders. This did not make sense to set at the loader level, since the loader does not know how long each individual entry should be cached for.

If your live loader returns cache hints with `maxAge`, you need to remove this property:

```diff
return {
  entries: [...],
  cacheHint: {
    tags: ['my-tag'],
-   maxAge: 60,
    lastModified: new Date(),
  },
};
```

The `cacheHint` object now only supports `tags` and `lastModified` properties. If you want to set the max age for a page, you can set the headers manually:

```astro
---
Astro.headers.set('cdn-cache-control', 'maxage=3600');
---
```

