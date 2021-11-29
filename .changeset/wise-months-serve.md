---
'astro': patch
---

Fixes use of `PUBLIC_` to reference env vars

Previously `PUBLIC_` worked in server-only components such as .astro components. However if you had a client-side component you had to use `VITE_`. This was a bug with our build that is now fixed.