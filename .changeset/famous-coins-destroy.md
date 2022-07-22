---
'astro': minor
'@astrojs/cloudflare': minor
'@astrojs/deno': minor
'@astrojs/image': minor
'@astrojs/netlify': minor
'@astrojs/node': minor
'@astrojs/sitemap': minor
'@astrojs/vercel': minor
---

New `mode` configuration option

This change introduces a new configuration option `mode`. Mode can be either

* `static` - The default, when building a static site.
* `server` - When building an app to be deployed for SSR (server-side rendering).

The default, `static`, can be omitted from your config file.

If you want to use SSR you now need to provide `output: 'server'` *in addition* to an adapter.

The `adapter` configuration has been renamed to `deploy`. In the future adapters will support configuring a static site as well!

For SSR make this change:

```diff
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
-  adapter: netlify(),
+  deploy: netlify(),
+  output: 'server',
});
```
