---
'astro': patch
---

Fixes the `/_image` endpoint returning a bare 500 when a remote source image can't be fetched. The failure is now logged with the source URL and the upstream status or error, and the endpoint responds with `404` when the source is not found and `502` when it can't be retrieved.
