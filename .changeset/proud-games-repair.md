---
'astro': patch
---

Adds an error when `Astro.rewrite()` is used to rewrite an on-demand route with a static route when using the `"server"` output.

This is a forbidden rewrite because Astro can't retrieve the emitted static route at runtime. This route is served by the hosting platform, and not Astro itself. 
