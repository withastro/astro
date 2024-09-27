---
'astro': minor
---

Removes the experimental `contentCollectionsCache` introduced in `3.5.0`.

Astro Content Layer is now stable, and solves some of the issues of the legacy Content Collections. A Content Layer Cache may be introduced in the future but in the meantime, remove the flag from your Astro config:

```diff
export default defineConfig({
    experimental: {
-        contentCollectionsCache: true
    }
})
```
