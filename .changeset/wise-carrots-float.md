---
'astro': minor
---

Removes the experimental `contentCollectionsCache` introduced in `3.5.0`.

Astro Content Layer API independently solves some of the caching and performance issues with legacy content collections that this strategy attempted to address.  This feature has been replaced with continued work on improvements to the content layer. If you were using this experimental feature, you must now remove the flag from your Astro config as it no longer exists:

```diff
export default defineConfig({
    experimental: {
-        contentCollectionsCache: true
    }
})
```

The `cacheManifest` boolean argument is no longer passed to the `astro:build:done` integration hook:

```diff
const integration = {
    name: "my-integration",
    hooks: {
        "astro:build:done": ({
-            cacheManifest,
            logger
        }) => {}
    }
}
```
