---
'astro': patch
---

Adds `lastModified` field to experimental live collection cache hints

Live loaders can now set a `lastModified` field in the cache hints for entries and collections to indicate when the data was last modified. This is then available in the `cacheHint` field returned by `getCollection` and `getEntry`.
