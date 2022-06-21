---
'astro': patch
---

Significantly improved build performance

This change reflects in a significantly improved build performance, especially on larger sites.

With this change Astro is not building everything by statically analyzing `.astro` files. This means it no longer needs to dynamically *run* your code in order to know what JavaScript needs to be built.

With one particular large site we found it to build __32%__ faster.
