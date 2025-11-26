---
'@astrojs/cloudflare': major
---

Custom entrypoint API has changed

The `createExports()` function has been replaced with a direct export pattern. If you're using a custom `entryPoint` in your Cloudflare adapter config, update your worker file from:

```ts
import { createExports } from 'astro/app';
export const { default } = createExports(manifest);
```

to:

```ts
import { handle } from '@astrojs/cloudflare/utils/handler';
export default { fetch: handle };
```

The manifest is now created internally by the adapter.
