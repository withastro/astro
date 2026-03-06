---
"astro": patch
---

Fixes the CSRF origin check to block cross-origin requests regardless of `Content-Type`. Previously, requests with non-form content types (e.g. `application/json`) bypassed the origin check entirely. Now that's not the case anymore.
