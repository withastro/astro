---
'@astrojs/cloudflare': major
---

Development server now runs in workerd

`astro dev` now runs your Cloudflare application using Cloudflare's workerd runtime instead of Node.js. This means your development environment is now a near-exact replica of your production environment—the same JavaScript engine, the same APIs, the same behavior. You'll catch issues during development that would have only appeared in production, and features like Durable Objects, Workers Analytics Engine, and R2 bindings work exactly as they do on Cloudflare's platform.

## New runtime

Previously, `Astro.locals.runtime` provided access to Cloudflare-specific APIs. These APIs have now moved to align with Cloudflare's native patterns.

#### What should I do?

Update occurrences of `Astro.locals.runtime`:

- `Astro.locals.runtime.env` → Import `env` from `cloudflare:workers`
- `Astro.locals.runtime.cf` → Access via `Astro.request.cf`
- `Astro.locals.runtime.caches` → Use the global `caches` object
- `Astro.locals.runtime` (for `ExecutionContext`) → Use `Astro.locals.cfContext`

Here's an example showing how to update your code:

**Before:**
```astro
---
const { env, cf, caches, ctx } = Astro.locals.runtime;
const value = await env.MY_KV.get('key');
const country = cf.country;
await caches.default.put(request, response);
ctx.waitUntil(promise);
---
<h1>Country: {country}</h1>
```

**After:**
```astro
---
import { env } from 'cloudflare:workers';

const value = await env.MY_KV.get('key');
const country = Astro.request.cf.country;
await caches.default.put(request, response);
Astro.locals.cfContext.waitUntil(promise);
---
<h1>Country: {country}</h1>
```
