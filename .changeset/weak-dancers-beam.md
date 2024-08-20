---
'@astrojs/vercel': minor
---

Deprecates the `functionPerRoute` option

This option is now deprecated, and will be removed entirely in Astro v5.0. We suggest removing this option from your configuration as soon as you are able to:

```diff
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  // ...
  output: 'server',
  adapter: vercel({
-     functionPerRoute: true,
  }),
});
```
