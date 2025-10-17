---
'astro': patch
---

Fixes handling malformed cookies gracefully by returning the unparsed value instead of throwing

When a cookie with an invalid value is present (e.g., containing invalid URI sequences), `Astro.cookies.get()` now returns the raw cookie value instead of throwing a URIError. This aligns with the behavior of the underlying `cookie` package and prevents crashes when manually-set or corrupted cookies are encountered.
