---
'astro': patch
---

Fixes double URL-encoded paths returning 400 Bad Request on on-demand routes

Previously, any URL containing a double-encoded character (like `%255B`, which is `[` encoded twice) was unconditionally rejected with a `400 Bad Request` before middleware or route handlers could run. This broke embedded tools like Sanity Studio whose client-side router legitimately produces double-encoded URLs.

The fix replaces the rejection approach with iterative decoding — multi-level percent-encoding is now fully resolved to its canonical form before being passed to middleware and route matching. This preserves the security fix for CVE-2025-66202 (middleware authorization bypass via double encoding) because middleware now always sees the fully decoded path, making bypass impossible. For example, `/api/%2561dmin` is decoded to `/api/admin`, which middleware can correctly block.
