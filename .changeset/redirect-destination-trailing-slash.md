---
'astro': patch
---

Fixes a dynamic redirect whose destination is written with a trailing slash, such as `'/blog/[slug]/': '/articles/[slug]/'`, failing the build with `InvalidRedirectDestination`
