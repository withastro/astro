---
'astro': patch
---

Fixes trailing-slash redirect response body pointing to the incoming URL instead of the redirect target. The `location` header was correct, but the HTML body (`<meta http-equiv="refresh">`, `<title>`, and `<a>` tag) contained the original request path without the trailing-slash correction or query string.
