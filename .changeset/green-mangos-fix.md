---
'astro': major
'@astrojs/sitemap': patch
---

Remove the `pages` parameter from the `astro:build:done` integration hook.

#### Migration

The `pages` parameter was an undocumented parameter used by the `@astrojs/sitemap` integration. If your integration relied on `pages`, use the `routes` parameter and associated `pathname` property instead.

Note: The `pathname` property on `routes` does _not_ respect [the `trailingSlash` property](https://docs.astro.build/en/reference/configuration-reference/#trailingslash) in your Astro config. If needed, ensure you append this slash after reading the user's Astro config.
