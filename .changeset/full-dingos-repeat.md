---
'@astrojs/db': minor
---

Adds a new libSQL web driver to support environments that require a non-Node.js libSQL client such as Cloudflare or Deno. Also adds a new `mode` configuration option to allow you to set your client connection type: `node` (default) or `web`.


The default db `node` driver mode is identical to the previous AstroDB functionality. No changes have been made to how AstroDB works in Node.js environments, and this is still the integration's default behavior. If you are currently using AstroDB, no changes to your project code are required and setting a `mode` is not required.

However, if you have previously been unable to use AstroDB because you required a non-Node.js libSQL client, you can now install and configure the libSQL web driver by setting `mode: 'web'` in your `db` configuration:

```ts
import db from '@astrojs/db';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [db({ mode: 'web' })],
});
```

For more information, see the [`@astrojs/db` documentation](https://docs.astro.build/en/guides/integrations-guide/db/#mode).