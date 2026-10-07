---
'astro': patch
---

Fixes `security.checkOrigin` rejecting cross-origin requests with non-form content types such as `application/json`. As documented, the check only applies to unsafe requests that have no `content-type` header or one of `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`.
