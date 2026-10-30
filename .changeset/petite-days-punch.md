---
'@astrojs/cloudflare': patch
---

Fixes `cache.invalidate()` resolving when Cloudflare refuses the purge, such as one over the account's purge rate limit. `cache.invalidate()` now rejects in that case, with the errors Cloudflare returned as the error's `cause`, so a failed purge can be logged or retried.
