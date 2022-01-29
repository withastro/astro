---
'astro': patch
---

Respect subpath URL paths in the fetchContent url property. 

This fixes an issue where fetchContent() URL property did not include the buildOptions.site path in it.
