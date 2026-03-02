---
'astro': patch
---

Ensures that URLs with multiple leading slashes (e.g. `//admin`) are normalized to a single slash before reaching middleware, so that pathname checks like `context.url.pathname.startsWith('/admin')` work consistently regardless of the request URL format
