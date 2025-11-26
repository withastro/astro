---
'astro': patch
---

Fix authentication bypass via double URL encoding in middleware

Prevents attackers from bypassing path-based authentication checks using multi-level URL encoding (e.g., `/%2561dmin` instead of `/%61dmin`). Pathnames are now validated after decoding to ensure no additional encoding remains.
