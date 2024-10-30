---
'astro': patch
---

Now Astro emits an error when `Astro.rewrite` is used to rewrite an on-demand route with a static route, when using the `"server"` output.

This isn't possible because Astro can't retrieve the emitted static route at runtime, because it's served by the hosting platform, and not Astro itself. 
