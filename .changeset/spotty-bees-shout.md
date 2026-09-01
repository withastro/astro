---
'astro': patch
---

Fixes the dev server base middleware to respect path-segment boundaries when stripping the configured `base`. With a base such as `/s`, a request like `/src/pages/index.astro` is no longer treated as being under the base and rewritten to `/rc/pages/index.astro` during `astro dev`.
