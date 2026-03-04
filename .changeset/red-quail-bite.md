---
'astro': patch
---

Fixes an issue where a session ID from a cookie with no matching server-side data was accepted as-is. The session now generates a new ID when the cookie value has no corresponding storage entry.
