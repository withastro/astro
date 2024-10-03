---
'astro': patch
---

Fixes a regression that was introduced by an internal refactor of how the middleware is loaded by the Astro application. The regression was introduced by [#11550](https://github.com/withastro/astro/pull/11550).

When the edge middleware feature is opted in, Astro removes the middleware function from the SSR manifest, and this wasn't taken into account during the refactor.
