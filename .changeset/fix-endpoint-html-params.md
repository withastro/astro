---
'astro': patch
---

Fixes a bug where static file endpoints using `getStaticPaths` with `.html` in dynamic param values (e.g. `{ path: 'file.html' }`) would fail with a `NoMatchingStaticPathFound` error during build. The `.html` suffix is no longer incorrectly stripped from endpoint route pathnames.
