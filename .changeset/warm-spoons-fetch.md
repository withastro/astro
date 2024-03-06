---
"astro": patch
---

Adds a prefetch fallback when using the `experimental.clientPrerender` option. If prerendering fails, which can happen if [Chrome extensions block prerendering](https://developer.chrome.com/blog/speculation-rules-improvements#chrome-limits), it will fallback to prefetching the URL. This works by adding a `prefetch` field to the `speculationrules` script, but does not create an extra request.
