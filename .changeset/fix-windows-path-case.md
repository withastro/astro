---
'astro': patch
---

Fixes styles not being applied when the working directory path case differs from the filesystem on Windows. When a user starts the dev server from a path like `d:\dev\astro-demo` but the actual filesystem path is `D:\dev\astro-demo`, styles in Astro components were not applied. The fix adds a case-insensitive fallback search on Windows when exact match fails.
