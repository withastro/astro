---
'@astrojs/vercel': major
---

Remove the Vercel Edge adapter

 `@astrojs/vercel/serverless` now supports Edge middleware, so a separate adapter for Edge itself (deploying your entire app to the edge) is no longer necessary. Please update your Astro config to reflect this change:
 
 ```diff
 // astro.config.mjs
import { defineConfig } from 'astro/config';
- import vercel from '@astrojs/vercel/edge';
+ import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel({
+    edgeMiddleware: true
  }),
});
```
 
This adapter had several known limitations and compatibility issues that prevented many people from using it in production. To reduce maintenance costs and because we have a better story with Serveless + Edge Middleware, we are removing the Edge adapter.
