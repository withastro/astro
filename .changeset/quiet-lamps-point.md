---
'astro': patch
---

Fixes the HTML body of trailing-slash redirects in SSR pointing back at the requested URL instead of the redirect target, which made the meta refresh and the fallback link reload the same page
