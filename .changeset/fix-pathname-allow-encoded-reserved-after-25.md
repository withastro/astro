---
'astro': patch
---

Fixes dynamic route handlers returning 400 for request paths that contain a literal `%` next to a reserved character, such as the output of `encodeURIComponent('%?.pdf')` (`%25%3F.pdf`). Multi-level encoding detection is now scoped to the pre-decode signature `%25` followed by a hex pair, so legitimate `%25%XX` patterns are no longer rejected. Double-encoded paths like `/api/%2561dmin` still return 400 as before.
