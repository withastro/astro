---
'astro': patch
---

Fixes `getRelativeLocaleUrl`, `getAbsoluteLocaleUrl`, and `getAbsoluteLocaleUrlList` to strip trailing slashes when `trailingSlash: 'never'` is configured
