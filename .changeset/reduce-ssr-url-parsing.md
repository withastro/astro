---
'astro': patch
---

Reduces redundant per-request URL parsing and allocations in the core SSR render and match paths. The domain-based i18n `Host`-header probe now runs only when a `domains-*` strategy is configured, the trailing-slash handler reuses the URL already parsed by the render pipeline instead of re-parsing it, `getParams` avoids building intermediate arrays, the memory cache provider reuses the request URL it already parsed, and domain i18n memoizes its parsed lookup table. Internal performance change with no behavior difference.
