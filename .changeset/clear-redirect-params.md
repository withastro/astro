---
'astro': patch
---

Fixes a misleading `GetStaticPathsRequired` error when a redirect is configured from a dynamic route to a static (or less-dynamic) destination. For example, `'/project/[slug]': '/'` previously produced a confusing error pointing at `index.astro`. Astro now detects the parameter mismatch at config validation time and throws a clear `InvalidRedirectDestination` error naming the missing parameters.
