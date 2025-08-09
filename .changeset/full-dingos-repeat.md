---
'@astrojs/db': minor
---

Adds support for environments such as Cloudflare or Deno that require a non-node based libsql client.

To utilize this new feature, you must add the following to your Astro Db config. This will enable the usage of the alterative LibSQL web driver. In most cases this should only be needed on Cloudflare or Deno type environments, and using the default mode `node` will be enough for normal usage.

```ts
import db from '@astrojs/db';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [db({ mode: 'web' })],
});
```