---
'@astrojs/cloudflare': minor
---

Adds a `prerenderEnvironment` option to the Cloudflare adapter.

By default, Cloudflare uses its workerd runtime for prerendering static pages. Set `prerenderEnvironment` to `'node'` to use Astro's built-in Node.js prerender environment instead, giving prerendered pages access to the full Node.js ecosystem during both build and dev. This is useful when your prerendered pages depend on Node.js-specific APIs or npm packages that aren't compatible with workerd.

```js
// astro.config.mjs
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: cloudflare({
    prerenderEnvironment: 'node',
  }),
});
```
