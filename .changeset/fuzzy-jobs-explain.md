---
'@astrojs/cloudflare': minor
---

Expose the runtime bindings & environmental variabels via `Astro.locals`

  ```diff
  - import { getRuntime } from '@astrojs/cloudflare/runtime';
  - getRuntime(Astro.request);
  
  + const runtime = Astro.locals.runtime;
  + const env = runtime.env;
  ```
