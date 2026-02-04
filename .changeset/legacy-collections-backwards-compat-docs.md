---
'astro': patch
---

Adds `legacy.collectionsBackwardsCompat` flag that restores v5 backwards compatibility behavior for legacy content collections - ([v6 upgrade guidance](https://v6.docs.astro.build/en/guides/upgrade-to/v6/#legacy-content-collections-backwards-compatibility))

When enabled, this flag allows:
- Collections defined without loaders (automatically get glob loader)
- Collections with `type: 'content'` or `type: 'data'` 
- Config files located at `src/content/config.ts` (legacy location)
- Legacy entry API: `entry.slug` and `entry.render()` methods
- Path-based entry IDs instead of slug-based IDs

```js
// astro.config.mjs
export default defineConfig({
  legacy: {
    collectionsBackwardsCompat: true
  }
})
```

This is a temporary migration helper for v6 upgrades. Migrate collections to the Content Layer API, then disable this flag.