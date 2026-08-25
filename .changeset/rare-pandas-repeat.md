---
'@astrojs/cloudflare': patch
---

Adds the Worker version to the cache metadata of cached responses when the `CF_VERSION_METADATA` binding is configured. Responses carry an `astro-version:<id>` cache tag for version-specific purging, and responses that already send `Last-Modified` get a weak `ETag` that folds the version in. Conditional revalidation then returns fresh content after a deploy that changes rendered output but not content — most commonly the hashed asset URLs in server-rendered HTML. Without the binding, nothing changes.
