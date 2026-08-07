---
'astro': patch
---

Fixes a `TypeError: immutable` crash when route cache headers are applied to a response whose headers cannot be modified, such as a response returned directly from `fetch()`. The response is now rebuilt into a mutable copy before cache headers are applied, and CDN header stripping handles immutable provider responses the same way.
