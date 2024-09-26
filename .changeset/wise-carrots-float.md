---
'astro': minor
---

Removes the experimental `contentCollectionsCache` introduced in `3.5.0`.

To migrate, remove the flag from your Astro config:

```diff
export default defineConfig({
    experimental: {
-        contentCollectionsCache: true
    }
})
```
