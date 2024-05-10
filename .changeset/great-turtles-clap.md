---
"astro": patch
---

The prefetch feature is updated to better support different browsers and different cache headers setup, including:

1. All prefetch strategies will now always try to use `<link rel="prefetch">` if supported, or will fall back to `fetch()`.
2. The `prefetch()` programmatic API's `with` option is deprecated in favour of an automatic approach that will also try to use `<link rel="prefetch>` if supported, or will fall back to `fetch()`.

This change shouldn't affect most sites and should instead make prefetching more effective.
