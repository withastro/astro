---
'@astrojs/cloudflare': minor
---

The `getRuntime` utility has been deprecated and should be updated to the new [`Astro.locals`](https://docs.astro.build/en/guides/middleware/#locals) API.

```diff
- import { getRuntime } from '@astrojs/cloudflare/runtime';
- getRuntime(Astro.request);
  
+ const runtime = Astro.locals.runtime;
```
