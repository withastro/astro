---
'astro': major
---

Removes additional deprecated APIs:

- The Astro preview server now returns a 404 status instead of a 301 redirect when requesting assets from the public directory without a base.
- Removes special handling when referencing the `astro/client-image` type. You should use the `astro/client` type instead.
- Removes deprecated builtin `rss` support. You should use `@astrojs/rss` instead.
- Removes deprecated `Astro.request.params` support. You should use `Astro.params` instead.
