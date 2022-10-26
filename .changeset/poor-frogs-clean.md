---
'@astrojs/cloudflare': patch
---

enable access to cloudflare runtime [KV, R2, Durable Objects]
- access native cloudflare runtime through `import { getRuntime } from "@astrojs/cloudflare/runtime"` now you can call `getRuntime(Astro.request)` and get access to the runtime environment
