---
'astro': patch
---

Fixes a bug where a directory at the project root sharing the same name as a page route would cause the dev server to return a 404 instead of serving the page.
