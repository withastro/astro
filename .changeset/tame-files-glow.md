---
'@astrojs/netlify': major
---

Remove the Netlify Edge adapter

 `@astrojs/netlify/functions` now supports Edge middleware, so a separate adapter for Edge itself (deploying your entire app to the edge) is no longer necessary. Please update your Astro config to reflect this change:

 ```diff
 // astro.config.mjs
import { defineConfig } from 'astro/config';
- import netlify from '@astrojs/netlify/edge';
+ import netlify from '@astrojs/netlify/functions';

export default defineConfig({
  output: 'server',
  adapter: netlify({
+    edgeMiddleware: true
  }),
});
```

This adapter had several known limitations and compatibility issues that prevented many people from using it in production. To reduce maintenance costs and because we have a better story with Serveless + Edge Middleware, we are removing the Edge adapter.
