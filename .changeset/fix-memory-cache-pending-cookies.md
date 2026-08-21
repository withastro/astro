---
'astro': patch
---

Fixes the in-memory response cache storing responses that set a cookie through `Astro.cookies` or `Astro.session`. Such a response is personalized for the current request, so caching and replaying it could leak one user's response to another and drop the intended `Set-Cookie` header. These responses are now skipped, matching the existing behavior for responses with a raw `Set-Cookie` header.
