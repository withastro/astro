---
'astro': patch
---

Fixes an issue where the dev server would serve files like `/README.md` from the project root when they shouldn't be accessible. A new route guard middleware now blocks direct URL access to files that exist outside of `srcDir` and `publicDir`, returning a 404 instead.
