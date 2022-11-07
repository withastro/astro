---
'@astrojs/cloudflare': major
'@astrojs/deno': major
'@astrojs/node': major
'astro': patch
---

Handle base configuration in adapters

This allows adapters to correctly handle `base` configuration. Internally Astro now matches routes when the URL includes the `base`.

Adapters now also have access to the `removeBase` method which will remove the `base` from a pathname. This is useful to look up files for static assets.
